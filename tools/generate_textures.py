"""
OrbitLab procedural texture generator.

Generates every planetary texture used by the app (equirectangular maps that wrap
seamlessly around a sphere) from 3D fractal noise sampled on the unit sphere.
Because the noise is evaluated in 3D at each pixel's position on the sphere, the
maps have no seam at the antimeridian and no pinching artefacts at the poles.

The textures are original procedural artwork, so they carry no third-party
licence. They are *artistic approximations* of each body's appearance, not
cartographic maps.

Usage (from the project root):
    python3 tools/generate_textures.py

Requires: numpy, Pillow
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "textures"


# --------------------------------------------------------------------------- #
# Noise primitives
# --------------------------------------------------------------------------- #
class ValueNoise3D:
    """Seeded 3D value noise with smooth (quintic) interpolation."""

    def __init__(self, seed: int):
        rng = np.random.default_rng(seed)
        perm = rng.permutation(256)
        self.perm = np.concatenate([perm, perm]).astype(np.int64)
        self.values = rng.random(256).astype(np.float32)

    def _hash(self, x, y, z):
        p = self.perm
        return p[p[p[x & 255] + (y & 255)] + (z & 255)]

    def __call__(self, x, y, z):
        xi, yi, zi = np.floor(x).astype(np.int64), np.floor(y).astype(np.int64), np.floor(z).astype(np.int64)
        xf, yf, zf = x - xi, y - yi, z - zi
        # Quintic fade curve: 6t^5 - 15t^4 + 10t^3 (C2-continuous)
        u = xf * xf * xf * (xf * (xf * 6 - 15) + 10)
        v = yf * yf * yf * (yf * (yf * 6 - 15) + 10)
        w = zf * zf * zf * (zf * (zf * 6 - 15) + 10)
        val = self.values

        def corner(dx, dy, dz):
            return val[self._hash(xi + dx, yi + dy, zi + dz)]

        x00 = corner(0, 0, 0) * (1 - u) + corner(1, 0, 0) * u
        x10 = corner(0, 1, 0) * (1 - u) + corner(1, 1, 0) * u
        x01 = corner(0, 0, 1) * (1 - u) + corner(1, 0, 1) * u
        x11 = corner(0, 1, 1) * (1 - u) + corner(1, 1, 1) * u
        y0 = x00 * (1 - v) + x10 * v
        y1 = x01 * (1 - v) + x11 * v
        return y0 * (1 - w) + y1 * w


def fbm(noise, x, y, z, octaves=6, lacunarity=2.0, gain=0.5):
    """Fractal Brownian motion, normalised to roughly [0, 1]."""
    total = np.zeros_like(x, dtype=np.float32)
    amplitude, frequency, norm = 1.0, 1.0, 0.0
    for _ in range(octaves):
        total += amplitude * noise(x * frequency, y * frequency, z * frequency)
        norm += amplitude
        amplitude *= gain
        frequency *= lacunarity
    return total / norm


def sphere_grid(width, height):
    """Unit-sphere coordinates for every pixel of an equirectangular map."""
    u = (np.arange(width, dtype=np.float32) + 0.5) / width
    v = (np.arange(height, dtype=np.float32) + 0.5) / height
    lon = u * 2 * np.pi - np.pi
    lat = np.pi / 2 - v * np.pi
    lon, lat = np.meshgrid(lon, lat)
    x = np.cos(lat) * np.cos(lon)
    y = np.sin(lat)
    z = np.cos(lat) * np.sin(lon)
    return x, y, z, lat, lon


def normalise(a):
    a = a - a.min()
    return a / (a.max() + 1e-9)


def lerp_colors(t, stops):
    """Map scalar field t (0..1) through a list of (position, (r,g,b)) stops."""
    t = np.clip(t, 0, 1)
    positions = np.array([s[0] for s in stops], dtype=np.float32)
    colors = np.array([s[1] for s in stops], dtype=np.float32)
    out = np.zeros(t.shape + (3,), dtype=np.float32)
    for c in range(3):
        out[..., c] = np.interp(t, positions, colors[:, c])
    return out


def save_rgb(arr, name, quality=88):
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")
    img.save(OUT_DIR / name, quality=quality, optimize=True, progressive=True)
    print(f"  wrote {name} {img.size}")


def save_gray(arr, name, quality=88):
    img = Image.fromarray(np.clip(arr * 255, 0, 255).astype(np.uint8), "L")
    img.save(OUT_DIR / name, quality=quality, optimize=True)
    print(f"  wrote {name} {img.size}")


def crater_field(x, y, z, count, seed, min_r=0.01, max_r=0.12):
    """Height field of impact craters: depressed bowls with raised rims."""
    rng = np.random.default_rng(seed)
    height = np.zeros_like(x, dtype=np.float32)
    # Power-law size distribution: many small craters, few large ones
    radii = min_r + (max_r - min_r) * rng.random(count) ** 3.2
    centers = rng.normal(size=(count, 3))
    centers /= np.linalg.norm(centers, axis=1, keepdims=True)
    for (cx, cy, cz), r in zip(centers, radii):
        dot = np.clip(x * cx + y * cy + z * cz, -1, 1)
        d = np.arccos(dot) / r  # angular distance in crater radii
        mask = d < 1.6
        if not mask.any():
            continue
        dm = d[mask]
        bowl = -(1 - dm**2) * (dm < 1)
        rim = 0.45 * np.exp(-((dm - 1.0) ** 2) / 0.03)
        height[mask] += (bowl + rim) * (0.35 + r * 4)
    return height


# --------------------------------------------------------------------------- #
# Bodies
# --------------------------------------------------------------------------- #
def gen_sun(w=1024, h=512):
    x, y, z, *_ = sphere_grid(w, h)
    n = ValueNoise3D(11)
    granules = fbm(n, x * 18, y * 18, z * 18, octaves=5, gain=0.55)
    cells = fbm(n, x * 4 + 7, y * 4, z * 4, octaves=4)
    t = normalise(0.65 * granules + 0.35 * cells)
    rgb = lerp_colors(t, [
        (0.0, (190, 60, 8)), (0.35, (235, 120, 20)), (0.6, (255, 175, 45)),
        (0.85, (255, 214, 110)), (1.0, (255, 240, 190)),
    ])
    save_rgb(rgb, "sun.jpg")


def gen_rocky(name, seed, stops, w=1024, h=512, craters=260, crater_strength=0.5,
              noise_scale=3.0, bump=True, extra=None, post=None):
    x, y, z, lat, lon = sphere_grid(w, h)
    n = ValueNoise3D(seed)
    base = fbm(n, x * noise_scale, y * noise_scale, z * noise_scale, octaves=7)
    detail = fbm(n, x * 22 + 3, y * 22, z * 22, octaves=4)
    crater_h = crater_field(x, y, z, craters, seed + 1) if craters else 0
    height = normalise(base * 0.75 + detail * 0.25 + crater_strength * crater_h * 0.25)
    if extra:
        height = extra(height, x, y, z, lat, n)
    rgb = lerp_colors(height, stops)
    if post:
        rgb = post(rgb, x, y, z, lat, n)
    save_rgb(rgb, f"{name}.jpg")
    if bump:
        save_gray(height, f"{name}_bump.jpg")


def gen_earth(w=2048, h=1024):
    x, y, z, lat, _ = sphere_grid(w, h)
    n = ValueNoise3D(3)
    # Domain-warped noise gives more continent-like coastlines
    warp = fbm(n, x * 2 + 11, y * 2, z * 2, octaves=4)
    elev = fbm(n, x * 1.6 + warp * 1.4, y * 1.6 + warp, z * 1.6 - warp, octaves=8)
    elev = normalise(elev)
    sea_level = float(np.quantile(elev, 0.69))  # ~70% of the surface is ocean
    land = elev > sea_level
    abs_lat = np.abs(lat) / (np.pi / 2)

    ocean_depth = np.clip((sea_level - elev) / sea_level, 0, 1)
    ocean = lerp_colors(ocean_depth, [(0, (38, 92, 150)), (0.25, (18, 58, 118)), (1, (6, 22, 62))])

    land_h = np.clip((elev - sea_level) / (1 - sea_level), 0, 1)
    moisture = fbm(n, x * 3 + 40, y * 3, z * 3, octaves=5)
    # Deserts near ~25° latitude, vegetation elsewhere, rock at altitude
    desert_band = np.exp(-((abs_lat - 0.28) ** 2) / 0.012)
    dryness = np.clip(desert_band * 0.7 + (0.45 - moisture) * 1.6, 0, 1) * np.clip(land_h * 4, 0, 1)
    green = lerp_colors(land_h, [(0, (58, 98, 44)), (0.5, (82, 110, 56)), (1, (120, 112, 90))])
    desert = lerp_colors(land_h, [(0, (196, 164, 112)), (1, (160, 128, 92))])
    land_rgb = green * (1 - dryness[..., None]) + desert * dryness[..., None]

    rgb = np.where(land[..., None], land_rgb, ocean)
    # Polar ice caps with noisy edges
    ice_edge = 0.82 + (fbm(n, x * 6, y * 6, z * 6, octaves=4) - 0.5) * 0.12
    ice = np.clip((abs_lat - ice_edge) / 0.04, 0, 1)
    rgb = rgb * (1 - ice[..., None]) + np.array([235, 240, 246]) * ice[..., None]
    save_rgb(rgb, "earth.jpg")

    # Specular map: oceans shine, land is matte
    spec = np.where(land | (ice > 0.5), 0.08, 0.85).astype(np.float32)
    save_gray(spec, "earth_specular.jpg")
    save_gray(np.where(land, land_h * 0.9 + 0.1, 0.0), "earth_bump.jpg")

    # Clouds: swirling, latitude-banded coverage; stored as greyscale alpha
    cw, ch = 1024, 512
    x, y, z, lat, _ = sphere_grid(cw, ch)
    swirl = fbm(n, x * 3 + 90, y * 3, z * 3, octaves=3)
    c = fbm(n, x * 5 + swirl * 2, y * 9, z * 5 - swirl * 2, octaves=7)
    band = 0.75 + 0.25 * np.cos(np.abs(lat) * 6)
    clouds = np.clip((c * band - 0.42) / 0.3, 0, 1)
    save_gray(clouds, "earth_clouds.jpg")


def gen_banded(name, seed, palette, w=1024, h=512, band_freq=14, turbulence=0.08,
               storm=None, contrast=1.0):
    """Gas/ice giant: colour is a function of (perturbed) latitude."""
    x, y, z, lat, lon = sphere_grid(w, h)
    n = ValueNoise3D(seed)
    turb = fbm(n, x * 6, y * 22, z * 6, octaves=6) - 0.5
    fine = fbm(n, x * 30, y * 90, z * 30, octaves=3) - 0.5
    lat_n = (y + turb * turbulence + fine * turbulence * 0.25)
    bands = 0.5 + 0.5 * np.sin(lat_n * band_freq + np.sin(lat_n * band_freq * 0.37) * 2.0)
    bands = 0.5 + (bands - 0.5) * contrast
    variation = fbm(n, x * 2 + 5, y * 8, z * 2, octaves=3)
    t = np.clip(bands * 0.8 + variation * 0.2, 0, 1)
    rgb = lerp_colors(t, palette)
    if storm:
        s_lat, s_lon, s_w, s_h, color = storm
        dlat = (lat - s_lat) / s_h
        dlon = np.angle(np.exp(1j * (lon - s_lon))) / s_w
        r = np.sqrt(dlat**2 + dlon**2)
        swirl = fbm(n, x * 40, y * 40, z * 40, octaves=3)
        m = np.clip((1.0 - r + (swirl - 0.5) * 0.3) * 2.5, 0, 1)
        rgb = rgb * (1 - m[..., None]) + np.array(color) * m[..., None]
    save_rgb(rgb, f"{name}.jpg")


def gen_saturn_ring(w=1024, h=64):
    """Radial ring profile (inner -> outer). RGB + alpha stored as PNG."""
    r = np.linspace(0, 1, w, dtype=np.float32)
    rng = np.random.default_rng(7)
    fine = np.convolve(rng.random(w), np.ones(5) / 5, mode="same")
    # Approximate structure: faint C ring, bright B ring, Cassini Division, A ring
    density = np.zeros(w, dtype=np.float32)
    density += 0.25 * ((r > 0.00) & (r < 0.28))                   # C ring
    density += 0.95 * ((r >= 0.28) & (r < 0.62))                  # B ring
    density += 0.04 * ((r >= 0.62) & (r < 0.68))                  # Cassini Division
    density += 0.70 * ((r >= 0.68) & (r < 0.93))                  # A ring
    density *= 1.0 - 0.9 * ((r > 0.865) & (r < 0.875))           # Encke Gap
    density += 0.30 * ((r >= 0.96) & (r < 0.975))                 # F ring
    density *= 0.75 + 0.5 * fine
    density = np.clip(density, 0, 1)
    color = lerp_colors(r, [(0, (130, 115, 95)), (0.4, (224, 205, 170)),
                            (0.7, (200, 182, 150)), (1, (170, 155, 130))])
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[..., :3] = np.clip(color, 0, 255).astype(np.uint8)[None, :, :]
    rgba[..., 3] = (density * 255).astype(np.uint8)[None, :]
    Image.fromarray(rgba, "RGBA").save(OUT_DIR / "saturn_ring.png", optimize=True)
    print("  wrote saturn_ring.png")


def gen_milky_way(w=2048, h=1024):
    """Very faint galactic band and distant galaxies for the sky sphere."""
    x, y, z, lat, lon = sphere_grid(w, h)
    n = ValueNoise3D(99)
    # Tilt the galactic plane relative to the ecliptic (~60°)
    tilt = np.radians(60)
    gy = y * np.cos(tilt) - z * np.sin(tilt)
    band = np.exp(-(gy**2) / 0.025)
    dust = fbm(n, x * 8, y * 8, z * 8, octaves=6)
    clouds = fbm(n, x * 3 + 4, y * 3, z * 3, octaves=5)
    glow = band * (0.4 + 0.9 * clouds) * (1 - 0.75 * np.clip((dust - 0.45) * 3, 0, 1))
    rgb = np.zeros(x.shape + (3,), dtype=np.float32)
    rgb += glow[..., None] * np.array([46, 44, 60])
    rgb += np.array([3, 4, 10])  # deep navy floor
    # Nebulous colour tints
    tint = fbm(n, x * 2 + 30, y * 2, z * 2, octaves=3)
    rgb += (band * np.clip(tint - 0.5, 0, 1))[..., None] * np.array([40, 18, 50])
    # Small distant galaxies: soft ellipses
    rng = np.random.default_rng(5)
    for _ in range(14):
        c = rng.normal(size=3); c /= np.linalg.norm(c)
        size = rng.uniform(0.006, 0.016)
        d = np.arccos(np.clip(x * c[0] + y * c[1] + z * c[2], -1, 1))
        m = np.exp(-(d / size) ** 2) * rng.uniform(25, 60)
        rgb += m[..., None] * np.array([0.9, 0.85, 1.0])
    # Faint unresolved star dust
    speck = rng.random(x.shape) > 0.9985
    rgb[speck] += rng.uniform(40, 140, size=(speck.sum(), 1))
    save_rgb(rgb, "milky_way.jpg", quality=82)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print("Generating OrbitLab textures ->", OUT_DIR)
    gen_sun()

    gen_rocky("mercury", 21, [
        (0, (70, 66, 62)), (0.45, (128, 122, 114)), (0.75, (168, 160, 150)), (1, (205, 198, 188)),
    ], craters=420, crater_strength=1.0)

    def venus_clouds(height, x, y, z, lat, n):
        streaks = fbm(n, x * 3, y * 12, z * 3, octaves=6)
        return normalise(height * 0.25 + streaks * 0.75)
    gen_rocky("venus", 31, [
        (0, (150, 104, 52)), (0.4, (205, 160, 92)), (0.7, (230, 196, 132)), (1, (246, 226, 180)),
    ], craters=0, bump=False, extra=venus_clouds)

    gen_earth()

    gen_rocky("moon", 41, [
        (0, (60, 60, 62)), (0.4, (110, 110, 112)), (0.7, (160, 160, 158)), (1, (210, 210, 205)),
    ], craters=360, crater_strength=1.1)

    def mars_albedo(height, x, y, z, lat, n):
        # Darker albedo regions (like Syrtis Major) blended into the relief
        albedo = fbm(n, x * 2.5 + 17, y * 2.5, z * 2.5, octaves=5)
        return normalise(height * 0.6 + albedo * 0.4)

    def mars_caps(rgb, x, y, z, lat, n):
        edge = 0.9 + (fbm(n, x * 8, y * 8, z * 8, octaves=4) - 0.5) * 0.06
        cap = np.clip((np.abs(lat) / (np.pi / 2) - edge) / 0.03, 0, 1)[..., None]
        return rgb * (1 - cap) + np.array([238, 230, 222]) * cap

    gen_rocky("mars", 51, [
        (0, (74, 34, 20)), (0.35, (140, 62, 32)), (0.65, (188, 96, 52)), (1, (214, 146, 98)),
    ], craters=160, crater_strength=0.5, extra=mars_albedo, post=mars_caps)

    gen_banded("jupiter", 61, [
        (0, (128, 82, 54)), (0.3, (180, 128, 88)), (0.5, (218, 182, 140)),
        (0.7, (236, 222, 200)), (1, (246, 238, 226)),
    ], band_freq=22, turbulence=0.10, contrast=0.8,
       storm=(np.radians(-22), 0.9, 0.2, 0.09, (196, 98, 64)))

    gen_banded("saturn", 71, [
        (0, (170, 140, 96)), (0.4, (206, 180, 132)), (0.7, (226, 206, 160)), (1, (240, 226, 190)),
    ], band_freq=26, turbulence=0.04, contrast=0.7)

    gen_banded("uranus", 81, [
        (0, (150, 205, 212)), (0.5, (170, 220, 226)), (1, (196, 234, 238)),
    ], band_freq=10, turbulence=0.03, contrast=0.35)

    gen_banded("neptune", 91, [
        (0, (34, 62, 158)), (0.4, (52, 90, 196)), (0.75, (76, 120, 220)), (1, (120, 160, 236)),
    ], band_freq=14, turbulence=0.09, contrast=0.6,
       storm=(np.radians(-20), -1.2, 0.12, 0.05, (24, 38, 104)))

    gen_saturn_ring()
    gen_milky_way()
    print("Done.")


if __name__ == "__main__":
    main()
