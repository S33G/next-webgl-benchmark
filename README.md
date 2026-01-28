# WebGL Animations Benchmark

A high-performance WebGL visualization and benchmarking application built with Next.js, React, Three.js, and PostProcessing effects.

## Overview

This project provides an interactive platform for rendering complex 3D animations with real-time performance monitoring. It features multiple scene presets, post-processing effects (Bloom and Depth of Field), custom GLSL shaders, and comprehensive benchmarking tools to measure rendering performance under various load conditions.

## Features

- **Multiple 3D Scenes**:
  - **Trippy**: Original psychedelic scene with custom shaders, instancing, and particles
  - **Solar System**: Realistic textured planets with orbital mechanics
  - **Earth**: Realistic Earth with day/night textures, clouds, and atmospheric glow
  - **Star Wars Credits**: Opening crawl with educational WebGL content
  - **Minecraft World**: Procedural voxel terrain with biomes, torches, and day/night cycle (Heavy - may take 2-5s to load)
- **URL-Based Scene Routing**: Direct links to scenes via `/earth`, `/minecraft`, `/space`, `/starwars`, `/trippy`
- **Loading Indicators**: Animated spinner with timeout detection for scene transitions
- **Error Boundaries**: Graceful error handling with user-friendly recovery options
- **Real-Time Performance Metrics**: Monitor FPS, GPU memory, and rendering statistics
- **Post-Processing Effects**:
  - Bloom effect for vibrant light blooms
  - Depth of Field (DoF) for cinematic focus
  - Smooth animated transitions when changing effects
- **Custom GLSL Shaders**:
  - Noise Glow Shader
  - Procedural Pattern Shader
  - Reflection Distortion Shader
- **Instanced Rendering**: Efficiently render thousands of objects using WebGL instancing
- **Particle Systems**: Dynamic particle effects for enhanced visuals
- **Benchmark Modes**:
  - Auto Ramp: Gradually increase complexity to find performance ceiling
  - Stress Test: Push GPU to limits with extreme load
  - Fixed Preset: Run benchmarks at predefined quality levels (Low, Medium, High, Ultra)

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with React 19
- **3D Graphics**: [Three.js](https://threejs.org/) v0.182.0
- **Post-Processing**: [PostProcessing](https://github.com/pmndrs/postprocessing) v6.38.2
- **Language**: TypeScript 5.6
- **Styling**: CSS with responsive design

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: LTS)
- npm, yarn, or bun package manager

### Installation

1. Clone the repository:
```bash
git clone git@github.com:S33G/next-webgl-benchmark.git
cd next-webgl-benchmark
```

2. Install dependencies:
```bash
bun install
```

3. Start the development server:
```bash
bun run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Scene Navigation

Navigate directly to specific scenes via URL:
- [http://localhost:3000/earth](http://localhost:3000/earth) - Earth scene
- [http://localhost:3000/minecraft](http://localhost:3000/minecraft) - Minecraft voxel world
- [http://localhost:3000/space](http://localhost:3000/space) - Solar System
- [http://localhost:3000/starwars](http://localhost:3000/starwars) - Star Wars credits
- [http://localhost:3000/trippy](http://localhost:3000/trippy) - Original trippy scene

### Performance Controls
Adjust rendering parameters in real-time:
- **Scene Selector**: Choose between Trippy, Solar System, Earth, Star Wars Credits, or Minecraft World
- **Resolution Scale**: 0.5x to 1.0x (impacts render target resolution)
- **Instance Count**: Number of instanced objects (100-10,000+)
- **Particle Count**: Number of particles (1,000-50,000+)
- **Enable/Disable Effects**: Toggle bloom and depth of field with smooth animations

### Benchmarking

Run benchmarks to measure GPU performance:

1. **Auto Ramp**: Gradually increases complexity until FPS drops
2. **Stress Test**: Runs at maximum complexity for extended period
3. **Fixed Presets**: Run at predefined quality levels with specified duration

Results display:
- Average FPS
- Peak FPS
- Minimum FPS
- Frame time statistics
- Effect timings

## Performance Monitoring

Real-time metrics display shows:
- **Current FPS**: Live frame rate
- **Benchmark Status**: Current phase and progress
- **GPU Load**: Estimated GPU utilization

## Minecraft Scene Details

The Minecraft World scene features:
- **Procedural Terrain**: 300×300 blocks with Perlin noise heightmap
- **Multi-Biome System**: Grass, desert, and snow biomes with 7 block types
- **Optimized Rendering**: Geometry merging reduces 90,000+ meshes to ~7 merged meshes
- **Dynamic Lighting**: ~240 torches with point lights, day/night cycle
- **Interactive Elements**: Voxel trees, wandering sheep
- **Performance Note**: Initial generation takes 2-5 seconds depending on device

## Available Scripts

```bash
npm run dev       # Start development server with hot reload
npm run build     # Build for production
npm start         # Run production server
npm run lint      # Run ESLint
```

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## Texture Credits

Planet textures sourced from Three.js examples repository:
- Textures: [Three.js Examples](https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets) - Public Domain
- Used in Solar System and Earth scenes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
