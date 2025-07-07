# Fourier Wave Generator

A GPU-accelerated wave animation generator using Fourier synthesis, perfect for creating seamlessly tileable animated normal maps and height maps for games.

## Features

### 🌊 **Fourier Wave Synthesis**
- Mathematical wave generation using sum of sinusoids
- Natural, ocean-like wave patterns
- Up to 8 configurable wave components
- Real-time GPU rendering with WebGL

### 🔄 **Perfect Looping**
- Temporal frequencies constrained to integers
- Mathematically guaranteed loop continuity
- Customizable loop duration

### 🧩 **Seamless Tiling**
- Spatial frequencies quantized for seamless texture tiling
- Perfect for game engine texture mapping
- No visible seams when tiled

### 🎛️ **Dual Output Modes**
- **Normal Maps**: RGB normal maps for surface detail
- **Height Maps**: Grayscale displacement maps

### 📦 **Export System**
- Export animation sequences as ZIP files
- Configurable resolution (256x256 to 2048x2048)
- Configurable frame count (8-120 frames)
- Organized file naming

### 💾 **Preset System**
- Export current settings as JSON presets
- Import and share preset configurations
- Version-controlled preset format

## Wave Parameters

Each Fourier component has:
- **Amplitude**: Wave height (0.01 - 1.0)
- **Spatial Frequency**: Wave density in space (0.1 - 5.0)
- **Temporal Frequency**: Animation speed (1-16 integers)
- **Direction**: Wave propagation direction (X, Y)
- **Phase**: Initial phase offset (0 - 2π)

## Usage

1. **Adjust Wave Parameters**: Configure each Fourier component
2. **Set Global Settings**: Wave scale, normal intensity, height range
3. **Choose Output Mode**: Normal map or height map
4. **Export**: Generate ZIP file with animation sequence

## Preset Format

```json
{
  "version": "1.0",
  "name": "Fourier Wave Preset",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "settings": {
    "loopDuration": 2.0,
    "speed": 1.0,
    "layerCount": 4,
    "outputMode": "normal",
    "waveScale": 1.0,
    "normalIntensity": 1.0,
    "heightRange": 1.0,
    "waveLayers": [
      {
        "amplitude": 0.8,
        "spatialFreq": 0.5,
        "temporalFreq": 1,
        "direction": { "x": 1.0, "y": 0.0 },
        "phase": 0.0
      }
    ]
  }
}
```

## Technical Details

- **Rendering**: WebGL 2.0 with fallback to WebGL 1.0
- **Tiling**: Spatial frequencies quantized to ensure seamless tiling
- **Looping**: Temporal frequencies are integers for perfect temporal loops
- **Export**: Canvas-to-blob conversion with JSZip packaging

## Browser Support

- Chrome 51+
- Firefox 51+
- Safari 10+
- Edge 79+

Requires WebGL support for GPU acceleration.

## Getting Started

1. Clone or download the files
2. Start a local HTTP server:
   ```bash
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser
4. Start creating waves!

## Use Cases

- **Game Development**: Ocean, lake, and river surfaces (normal maps for lighting, height maps for displacement)
- **VFX**: Water simulation previews and displacement mapping
- **Education**: Wave physics visualization
- **Art**: Procedural texture generation for both bump and displacement effects

## Tips for Best Results

1. **Layer Combinations**: Use decreasing amplitude and increasing frequency for realistic water
2. **Direction Variety**: Mix different wave directions for natural-looking patterns
3. **Steepness Control**: Higher values (0.5-0.9) create sharp, peaked waves; lower values (0.1-0.4) create gentle, smooth waves
4. **Speed Settings**: Keep speeds moderate (0.2-2.0) for smooth looping - very high speeds may cause visual artifacts
5. **Export Settings**: Use higher resolutions for detailed close-up textures
6. **Mode Selection**: 
   - Use **Normal Maps** for surface detail and lighting effects
   - Use **Height Maps** for displacement/tessellation and vertex displacement
7. **Height Range**: Adjust the height range in height map mode to control displacement intensity
8. **Randomization**: Use the randomize buttons to quickly generate new wave patterns - great for exploration and finding interesting combinations
9. **Looping**: The animation seamlessly loops based on your specified duration - perfect for game engines and video applications

## Performance Notes

- Real-time performance depends on GPU capabilities
- Export time increases with resolution and frame count
- Multiple layers impact performance - adjust as needed

---

*Built with WebGL, vanilla JavaScript, and lots of wave mathematics! 🌊* 