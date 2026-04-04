![MapArt Studio Banner](./public/assets/banner.png)

# MapArt Studio

[![Website Badge](https://img.shields.io/badge/Website-fff?logo=appveyor&logoColor=000&style=for-the-badge)](https://mapart-studio-nxypwfqda-luis-borralhos-projects.vercel.app)
[![GitHub Badge](https://img.shields.io/badge/GitHub-fff?logo=github&logoColor=000&style=for-the-badge)](https://github.com/lborralho/MapArt-Studio)

[![Vite Badge](https://img.shields.io/badge/Vite-9135FF?logo=vite&logoColor=fff&style=for-the-badge)](https://vitejs.dev)
[![React Badge](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000&style=for-the-badge)](https://react.dev/)
[![TypeScript Badge](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=fff&style=for-the-badge)](https://www.typescriptlang.org)
[![OpenStreetMap Badge](https://img.shields.io/badge/OpenStreetMap-7EBC6F?logo=openstreetmap&logoColor=fff&style=for-the-badge)](https://www.openstreetmap.org)
[![MapLibre Badge](https://img.shields.io/badge/MapLibre-000?logo=maplibre&logoColor=fff&style=for-the-badge)](https://maplibre.org/)
[![Vercel Badge](https://img.shields.io/badge/Vercel-000?logo=vercel&logoColor=fff&style=for-the-badge)](https://vercel.com)

> Create stunning, print-ready map posters for any location in the world — free, open-source, and entirely in your browser.

## Acknowledgment

This project is a JavaScript reimplementation inspired by the original [MapToPoster](https://github.com/originalankur/maptoposter) by [Ankur Gupta](https://github.com/originalankur) (MIT license) and built upon [TerraInk](https://github.com/yousifamanuel/terraink) by Yousif Amanuel. It uses React, TypeScript, and Vite, leveraging OpenStreetMap data rendered via MapLibre and OpenFreeMap vector tiles.

## Features

- **Custom city map posters** for any location in the world, powered by real OpenStreetMap data
- **Smart geocoding** — search for any city or region by name, or enter coordinates manually
- **Rich theme system** — choose from dozens of curated themes or build your own custom colour palette
- **Detailed map layers** — roads, water bodies, parks, and building footprints with per-layer styling
- **Typography controls** — set city/country display labels and load any Google Fonts family
- **Marker system** — add custom markers with icons to highlight points of interest
- **High-resolution export** — download print-ready posters in PNG format at any defined dimension

## Data Providers and Mapping Stack

| Component | Provider |
|-----------|----------|
| Map data | [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) |
| Tiles | [OpenMapTiles](https://openmaptiles.org/) |
| Tile hosting | [OpenFreeMap](https://openfreemap.org/) |
| Geocoding | [Nominatim](https://nominatim.openstreetmap.org/) |
| Map renderer | [MapLibre](https://maplibre.org/) |

## User Interface

![MapArt Studio UI](./public/assets/screenshots/Web_UI.png)

## Showcase

<p align="center">
  <img src="./public/assets/showcase/showcase_1.png" alt="Showcase example 1" width="100%" />
  <img src="./public/assets/showcase/showcase_2.png" alt="Showcase example 2" width="100%" />
</p>

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Check [`.env.example`](./.env.example) for available variables. They are optional for most local work.

## Deploy to Vercel

This project is configured for one-click deployment on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/lborralho/MapArt-Studio)

## Deploy with Docker (Self-Hosting)

### Build and run with Docker Compose

```bash
docker compose up -d --build
```

This serves the app on `http://localhost:7200` by default.

### Stop the deployment

```bash
docker compose down
```

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a PR.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
