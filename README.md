# 🌊 Fourier Wave Generator

[![WebGL](https://img.shields.io/badge/WebGL-2.0%20%7C%201.0-blue.svg)](https://webgl.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-5-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/HTML)

A GPU-accelerated wave animation generator using Fourier synthesis, perfect for creating seamlessly tileable animated normal maps and height maps for games and visual effects.

[![Wave Generator Demo](https://img.shields.io/badge/Demo-Live%20Preview-blue?style=for-the-badge&logo=javascript)](https://ammarillo.github.io/WaveGenV2/)


## ✨ Features

### 🌊 **Fourier Wave Synthesis**
- Mathematical wave generation using sum of sinusoids
- Natural, ocean-like wave patterns with up to 8 configurable components
- Real-time GPU rendering with WebGL 2.0/1.0
- Wave sharpening for realistic oscilloscope-like waveforms

### 🔄 **Perfect Looping Animation**
- Temporal frequencies constrained to integers for mathematically guaranteed loop continuity
- Customizable loop duration and playback speed
- Seamless temporal loops perfect for game engines

### 🧩 **Seamless Texture Tiling**
- Spatial frequencies quantized for seamless texture tiling
- Perfect for game engine texture mapping
- No visible seams when tiled in any direction

### 🎛️ **Dual Output Modes**
- **Normal Maps**: RGB normal maps for surface detail and lighting effects
- **Height Maps**: Grayscale displacement maps for tessellation and vertex displacement

### 📦 **Advanced Export System**
- Export animation sequences as ZIP files
- Configurable resolution (256x256 to 2048x2048)
- Configurable frame count (8-120 frames)
- Organized file naming with mode prefixes

### 💾 **Preset System**
- Export current settings as JSON presets
- Import and share preset configurations
- Version-controlled preset format with backward compatibility

### 🎨 **Real-time Controls**
- Live parameter adjustment with instant visual feedback
- Randomization tools for quick exploration
- Auto-save functionality for persistent settings

## 🚀 Quick Start

### Prerequisites
- Modern web browser with WebGL support
- Local HTTP server (for file access)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fourier-wave-generator.git
   cd fourier-wave-generator
   ```

2. **Start a local server**
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Python 2
   python -m SimpleHTTPServer 8000
   
   # Using Node.js
   npx http-server -p 8000
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

4. **Start creating waves!** 🌊

## 📖 Usage Guide

### Basic Workflow

1. **Configure Wave Layers**: Adjust amplitude, frequency, direction, and phase for each Fourier component
2. **Set Global Parameters**: Configure wave scale, normal intensity, and height range
3. **Choose Output Mode**: Select between normal maps or height maps
4. **Export Animation**: Generate ZIP file with your animation sequence

### Wave Parameters

Each Fourier component includes:

| Parameter | Range | Description |
|-----------|-------|-------------|
| **Amplitude** | 0.01 - 1.0 | Wave height and intensity |
| **Spatial Frequency** | 0.1 - 5.0 | Wave density in space |
| **Temporal Frequency** | 1-16 (integers) | Animation speed for perfect looping |
| **Direction X/Y** | -1.0 - 1.0 | Wave propagation direction |
| **Phase** | 0 - 2π | Initial phase offset |
| **Sharpness** | 0.0 - 1.0 | Wave shape sharpening |

### Output Modes

#### Normal Maps
- **Purpose**: Surface detail and lighting effects
- **Format**: RGB normal maps
- **Controls**: Normal intensity, normalize normals
- **Use Cases**: Game lighting, material effects

#### Height Maps
- **Purpose**: Displacement and tessellation
- **Format**: Grayscale displacement maps
- **Controls**: Height range, normalize heights
- **Use Cases**: Vertex displacement, terrain generation

## 📁 Preset System

### Exporting Presets
```javascript
// Preset format example
{
  "version": "1.0",
  "name": "Ocean Waves",
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
        "phase": 0.0,
        "sharpness": 0.2
      }
    ]
  }
}
```

### Importing Presets
1. Click "📁 Import Preset"
2. Select your JSON preset file
3. Settings will be automatically applied
4. Preset is saved to local storage

## 🎯 Use Cases

### Game Development
- **Ocean Surfaces**: Realistic water for open-world games
- **Lake Effects**: Calm water with gentle ripples
- **River Systems**: Flowing water with directional waves
- **Particle Effects**: Animated water splashes and droplets

### Visual Effects
- **Water Simulation**: Preview complex water behaviors
- **Displacement Mapping**: Create terrain and surface detail
- **Material Effects**: Realistic surface reflections and lighting

### Education
- **Wave Physics**: Visualize wave superposition
- **Fourier Analysis**: Understand frequency domain concepts
- **Animation Principles**: Study temporal wave behavior

### Digital Art
- **Procedural Textures**: Generate unique wave patterns
- **Background Elements**: Animated water backgrounds
- **Material Design**: Create custom water materials

## 💡 Tips for Best Results

### Wave Layer Combinations
- **Realistic Water**: Use decreasing amplitude with increasing frequency
- **Stormy Seas**: Higher amplitudes with varied directions
- **Calm Water**: Lower amplitudes with gentle frequencies

### Direction Variety
- **Natural Patterns**: Mix different wave directions
- **Complex Interactions**: Combine perpendicular and diagonal waves
- **Flow Simulation**: Use consistent direction for river effects

### Sharpness Control
- **Gentle Waves**: 0.0 - 0.3 for smooth, natural waves
- **Sharp Peaks**: 0.4 - 0.7 for dramatic, peaked waves
- **Extreme Shapes**: 0.8 - 1.0 for stylized, sharp waves

### Export Settings
- **Game Textures**: 512x512 or 1024x1024 resolution
- **High Detail**: 2048x2048 for close-up textures
- **Animation Length**: 30-60 frames for smooth loops
- **File Size**: Balance quality with download size

### Performance Optimization
- **Layer Count**: Start with 2-4 layers, add more as needed
- **Real-time Preview**: Lower resolution for smooth interaction
- **Export Quality**: Higher resolution only for final output

## 🔧 Technical Details

### Rendering Pipeline
- **WebGL 2.0**: Primary rendering with fallback to WebGL 1.0
- **Fragment Shaders**: GPU-accelerated wave computation
- **Real-time Updates**: 60 FPS animation with live parameter changes

### Mathematical Foundation
- **Fourier Synthesis**: Sum of sinusoidal wave components
- **Seamless Tiling**: Quantized spatial frequencies
- **Perfect Looping**: Integer temporal frequencies
- **Wave Sharpening**: Mathematical transformation for realistic shapes

### Browser Compatibility

| Browser | Version | WebGL Support |
|---------|---------|---------------|
| Chrome | 51+ | ✅ Full |
| Firefox | 51+ | ✅ Full |
| Safari | 10+ | ✅ Full |
| Edge | 79+ | ✅ Full |

### Performance Notes
- **GPU Dependent**: Real-time performance varies with graphics capabilities
- **Export Time**: Increases with resolution and frame count
- **Memory Usage**: Multiple layers impact VRAM usage
- **Mobile Support**: Limited by device GPU capabilities

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues, feature requests, or pull requests.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Follow existing JavaScript conventions
- Add comments for complex mathematical operations
- Test across different browsers
- Maintain backward compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WebGL Community**: For GPU acceleration capabilities
- **JSZip Library**: For ZIP file generation
- **Wave Mathematics**: Fourier analysis and synthesis principles
- **Game Development Community**: For real-world use case feedback

---

**Built with WebGL, vanilla JavaScript, and lots of wave mathematics! 🌊**

*Perfect for game developers, VFX artists, educators, and anyone who loves the beauty of mathematical waves.* 
