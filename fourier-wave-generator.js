class FourierWaveGenerator {
    constructor() {
        this.canvas = document.getElementById('waveCanvas');
        this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
        
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }
        
        // Animation state
        this.startTime = performance.now();
        this.currentTime = 0;
        this.loopDuration = 10.0;
        this.speed = 1.0;
        this.isPlaying = true;
        
        // Wave parameters
        this.waveScale = 0.2;
        this.normalIntensity = 0.6;
        this.heightRange = 1.0;
        this.outputMode = 'normal'; // 'normal' or 'height'
        this.normalizeHeights = false;
        this.normalMapFormat = 'opengl'; // 'directx' or 'opengl'
        this.tilingPreview = 1; // How many tiles to show for preview (1 = no tiling, 2 = 2x2, etc.)
        this.layerCount = 4;
        this.waveLayers = [];
        
        // Performance tracking
        this.lastFrameTime = 0;
        this.fps = 60;
        this.frameCount = 0;
        
        // Load saved settings before initializing
        this.loadSettings();
        
        this.initializeWaveLayers();
        this.setupGL();
        this.createShaders();
        this.setupGeometry();
        this.setupUI();
        
        // Update wave layer controls after UI setup to ensure loaded settings are applied
        this.updateWaveLayerControls();
        
        this.startAnimation();
    }
    
    // Save all current settings to localStorage
    saveSettings() {
        const settings = {
            version: '1.1',
            timestamp: new Date().toISOString(),
            loopDuration: this.loopDuration,
            speed: this.speed,
            layerCount: this.layerCount,
            outputMode: this.outputMode,
            waveScale: this.waveScale,
            normalIntensity: this.normalIntensity,
            heightRange: this.heightRange,
            normalizeHeights: this.normalizeHeights,
            normalMapFormat: this.normalMapFormat,
            tilingPreview: this.tilingPreview,
            waveLayers: this.waveLayers.slice(0, this.layerCount),
            // Export settings
            exportRes: document.getElementById('exportRes')?.value || '512',
            exportFrames: document.getElementById('exportFrames')?.value || '30'
        };
        
        try {
            localStorage.setItem('fourierWaveGeneratorSettings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save settings to localStorage:', error);
        }
    }
    
    // Load settings from localStorage
    loadSettings() {
        try {
            const saved = localStorage.getItem('fourierWaveGeneratorSettings');
            
            if (saved) {
                const settings = JSON.parse(saved);
                
                // Apply settings with validation
                this.loopDuration = settings.loopDuration || 10.0;
                this.speed = settings.speed || 1.0;
                this.layerCount = settings.layerCount || 4;
                this.outputMode = settings.outputMode || 'normal';
                this.waveScale = settings.waveScale || 0.2;
                this.normalIntensity = settings.normalIntensity || 0.6;
                this.heightRange = settings.heightRange || 1.0;
                this.normalizeHeights = settings.normalizeHeights || false;
                this.normalMapFormat = settings.normalMapFormat || 'opengl';
                this.tilingPreview = settings.tilingPreview || 1;
                
                // Load wave layers with backward compatibility
                if (settings.waveLayers && Array.isArray(settings.waveLayers)) {
                    this.waveLayers = [...settings.waveLayers];
                    
                    // Ensure all layers have sharpness property (backward compatibility)
                    for (let layer of this.waveLayers) {
                        if (layer.sharpness === undefined) {
                            layer.sharpness = 0.0;
                        }
                        // Ensure all layers have locked states (backward compatibility)
                        if (!layer.locked) {
                            layer.locked = {
                                amplitude: false, spatialFreq: false, temporalFreq: false,
                                direction: false, phase: false, sharpness: false
                            };
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load settings from localStorage:', error);
            // Fall back to default settings
        }
    }
    
    // Restore UI controls from loaded settings
    restoreUIControls() {
        // Update UI controls with loaded values
        const loopDurationInput = document.getElementById('loopDuration');
        const speedInput = document.getElementById('speed');
        const speedValue = document.getElementById('speedValue');
        const layerCountInput = document.getElementById('layerCount');
        const outputModeSelect = document.getElementById('outputMode');
        const waveScaleInput = document.getElementById('waveScale');
        const waveScaleValue = document.getElementById('waveScaleValue');
        const normalIntensityInput = document.getElementById('normalIntensity');
        const normalIntensityValue = document.getElementById('normalIntensityValue');
        const heightRangeInput = document.getElementById('heightRange');
        const heightRangeValue = document.getElementById('heightRangeValue');
        const normalizeHeightsInput = document.getElementById('normalizeHeights');
        const normalMapFormatSelect = document.getElementById('normalMapFormat');
        const tilingPreviewInput = document.getElementById('tilingPreview');
        const tilingPreviewValue = document.getElementById('tilingPreviewValue');
        const exportResSelect = document.getElementById('exportRes');
        const exportFramesInput = document.getElementById('exportFrames');
        
        if (loopDurationInput) loopDurationInput.value = this.loopDuration;
        if (speedInput) {
            speedInput.value = this.speed;
            if (speedValue) speedValue.textContent = this.speed.toFixed(1);
        }
        if (layerCountInput) {
            layerCountInput.value = this.layerCount;
            const layerCountValue = document.getElementById('layerCountValue');
            if (layerCountValue) layerCountValue.textContent = this.layerCount.toString();
        }
        if (outputModeSelect) outputModeSelect.value = this.outputMode;
        if (waveScaleInput) {
            waveScaleInput.value = this.waveScale;
            if (waveScaleValue) waveScaleValue.textContent = this.waveScale.toFixed(1);
        }
        if (normalIntensityInput) {
            normalIntensityInput.value = this.normalIntensity;
            if (normalIntensityValue) normalIntensityValue.textContent = this.normalIntensity.toFixed(1);
        }
        if (heightRangeInput) {
            heightRangeInput.value = this.heightRange;
            if (heightRangeValue) heightRangeValue.textContent = this.heightRange.toFixed(1);
        }
        if (normalizeHeightsInput) normalizeHeightsInput.checked = this.normalizeHeights;
        if (normalMapFormatSelect) normalMapFormatSelect.value = this.normalMapFormat;
        if (tilingPreviewInput) {
            tilingPreviewInput.value = this.tilingPreview;
            if (tilingPreviewValue) tilingPreviewValue.textContent = this.tilingPreview;
        }
        
        // Restore export settings if they exist
        try {
            const saved = localStorage.getItem('fourierWaveGeneratorSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                if (exportResSelect && settings.exportRes) exportResSelect.value = settings.exportRes;
                if (exportFramesInput && settings.exportFrames) exportFramesInput.value = settings.exportFrames;
            }
        } catch (error) {
            console.warn('Failed to restore export settings:', error);
        }
    }
    
    initializeWaveLayers() {
        // Only initialize default wave layers if none exist (i.e., first time or no saved data)
        if (!this.waveLayers || this.waveLayers.length === 0) {
            this.waveLayers = [
                { 
                    amplitude: 0.8, spatialFreq: 0.5, temporalFreq: 1, 
                    direction: { x: 1.0, y: 0.0 }, phase: 0.0, sharpness: 0.0,
                    locked: {
                        amplitude: false, spatialFreq: false, temporalFreq: false,
                        direction: false, phase: false, sharpness: false
                    }
                },
                { 
                    amplitude: 0.6, spatialFreq: 1.0, temporalFreq: 2, 
                    direction: { x: 0.7, y: 0.7 }, phase: 1.57, sharpness: 0.0,
                    locked: {
                        amplitude: false, spatialFreq: false, temporalFreq: false,
                        direction: false, phase: false, sharpness: false
                    }
                },
                { 
                    amplitude: 0.4, spatialFreq: 1.5, temporalFreq: 3, 
                    direction: { x: -0.5, y: 0.8 }, phase: 3.14, sharpness: 0.0,
                    locked: {
                        amplitude: false, spatialFreq: false, temporalFreq: false,
                        direction: false, phase: false, sharpness: false
                    }
                },
                { 
                    amplitude: 0.3, spatialFreq: 2.0, temporalFreq: 4, 
                    direction: { x: -0.8, y: -0.6 }, phase: 4.71, sharpness: 0.0,
                    locked: {
                        amplitude: false, spatialFreq: false, temporalFreq: false,
                        direction: false, phase: false, sharpness: false
                    }
                }
            ];
        } else {
            // Ensure all existing layers have locked states (backward compatibility)
            for (let layer of this.waveLayers) {
                if (!layer.locked) {
                    layer.locked = {
                        amplitude: false, spatialFreq: false, temporalFreq: false,
                        direction: false, phase: false, sharpness: false
                    };
                }
            }
        }
    }
    
    setupGL() {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.CULL_FACE);
    }
    
    createShaders() {
        const vertexShaderSource = `
            attribute vec2 a_position;
            varying vec2 v_uv;
            
            void main() {
                v_uv = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        const fragmentShaderSource = `
            precision highp float;
            
            varying vec2 v_uv;
            
            uniform float u_time;
            uniform float u_loopDuration;
            uniform float u_waveScale;
            uniform float u_waveSharpness;
            uniform float u_normalIntensity;
            uniform float u_heightRange;
            uniform int u_outputMode; // 0 = normal, 1 = height
            uniform bool u_normalizeHeights;
            uniform bool u_isDirectXNormal; // true = DirectX, false = OpenGL
            uniform float u_tilingPreview; // Number of tiles to show for preview
            uniform int u_layerCount;
            
            // Fourier wave layer parameters (up to 8 layers)
            uniform float u_amplitudes[8];
            uniform float u_spatialFreqs[8];
            uniform float u_temporalFreqs[8];
            uniform vec2 u_directions[8];
            uniform float u_phases[8];
            uniform float u_sharpnesses[8];
            
            // WebGL-compatible round function
            float roundCompat(float x) {
                return floor(x + 0.5);
            }
            
            // Wave sharpening function using the complete mathematical formula
            // Creates oscilloscope-like waveforms with sharp valleys and flat, shaped peaks
            float sharpenWave(float wave, float sharpness) {
                if (sharpness <= 0.001) {
                    return wave;
                }
                
                // Convert sharpness [0,1] to power parameter p
                // Higher sharpness = lower p = more dramatic shaping
                float p = 1.0 / (1.0 + sharpness * 4.0); // Range: p from 1.0 to 0.2
                
                // Step 1: Flip the wave to target valleys instead of peaks
                float y0 = -wave;
                
                // Step 2: Shift to negative space
                float y1 = y0 - 1.0; // Range: [-2, 0]
                
                // Step 3: Apply power function in negative space
                // y2 = -((-y1)^(1/p))
                float y2 = -pow(-y1, 1.0 / p);
                
                // Step 4: Shift back to center around zero
                float y3 = y2 + 1.0;
                
                // Step 5: Normalize back to [-1, 1] range
                // For this specific function, we can calculate the range analytically
                // When y1 = -2 (wave = -1): y2 = -pow(2, 1/p), y3 = 1 - pow(2, 1/p)
                // When y1 = 0 (wave = 1): y2 = 0, y3 = 1
                float minY3 = 1.0 - pow(2.0, 1.0 / p);
                float maxY3 = 1.0;
                float y4 = 2.0 * (y3 - minY3) / (maxY3 - minY3) - 1.0;
                
                // Step 6: Flip back to restore original orientation (now valleys are sharp)
                float y5 = -y4;
                
                // Blend between original wave and sharpened wave based on sharpness parameter
                return mix(wave, y5, sharpness);
            }
            
            // Fourier wave component function with seamless tiling and wave sharpening
            float fourierComponent(vec2 uv, float amplitude, float spatialFreq, float temporalFreq, 
                                 vec2 direction, float phaseOffset, float time, float sharpness) {
                // Normalize direction
                vec2 dir = normalize(direction);
                
                // For seamless tiling, work directly with UV coordinates [0,1]
                // and ensure wave vectors create integer cycles across the tile
                
                // Quantize the wave vector components to ensure seamless tiling
                // Each component should complete integer cycles across [0,1]
                float kx = roundCompat(spatialFreq * dir.x) * 2.0 * 3.14159;
                float ky = roundCompat(spatialFreq * dir.y) * 2.0 * 3.14159;
                vec2 k = vec2(kx, ky);
                
                // Use UV coordinates directly for spatial phase
                float spatialPhase = dot(k, uv);
                
                // Temporal phase: ω * t (ω is integer for perfect looping)
                float temporalPhase = temporalFreq * 2.0 * 3.14159 * time;
                
                // Total phase
                float phase = spatialPhase + temporalPhase + phaseOffset;
                
                // Generate base sine wave
                float wave = sin(phase);
                
                // Apply wave sharpening for more realistic wave shapes
                float sharpenedWave = sharpenWave(wave, sharpness);
                
                // Return amplified component
                return amplitude * sharpenedWave;
            }
            
            // Calculate normal using analytical derivatives for smooth gradients
            vec3 calculateNormal(vec2 uv, float epsilon) {
                float dhdx = 0.0;
                float dhdy = 0.0;
                
                // Calculate analytical derivatives directly from Fourier components
                for (int i = 0; i < 8; i++) {
                    if (i >= u_layerCount) break;
                    
                    float amplitude = u_amplitudes[i];
                    float spatialFreq = u_spatialFreqs[i];
                    float temporalFreq = u_temporalFreqs[i];
                    vec2 direction = normalize(u_directions[i]);
                    float phaseOffset = u_phases[i];
                    float sharpness = u_sharpnesses[i];
                    
                    // Quantized wave vector for seamless tiling
                    float kx = roundCompat(spatialFreq * direction.x) * 2.0 * 3.14159;
                    float ky = roundCompat(spatialFreq * direction.y) * 2.0 * 3.14159;
                    
                    // Phase calculation
                    float spatialPhase = kx * uv.x + ky * uv.y;
                    float temporalPhase = temporalFreq * 2.0 * 3.14159 * u_time;
                    float totalPhase = spatialPhase + temporalPhase + phaseOffset;
                    
                    // Base wave and its derivative
                    float wave = sin(totalPhase);
                    float waveDerivative = cos(totalPhase);
                    
                    // Apply sharpening to both wave and derivative
                    float sharpenedWave = sharpenWave(wave, sharpness);
                    
                    // For the derivative, we need to account for the sharpening transformation
                    float sharpenedDerivative = waveDerivative;
                    if (sharpness > 0.001) {
                        // Approximate the derivative of the sharpened wave
                        float p = 1.0 / (1.0 + sharpness * 4.0);
                        float y0 = -wave;
                        float y1 = y0 - 1.0;
                        if (abs(y1) > 0.001) {
                            float derivativeScale = (1.0 / p) * pow(abs(y1), (1.0 / p) - 1.0);
                            sharpenedDerivative = mix(waveDerivative, -waveDerivative * derivativeScale, sharpness);
                        }
                    }
                    
                    // Accumulate gradients
                    dhdx += amplitude * sharpenedDerivative * kx;
                    dhdy += amplitude * sharpenedDerivative * ky;
                }
                
                // Apply wave scale
                dhdx *= u_waveScale;
                dhdy *= u_waveScale;
                
                // Normal vector
                vec3 normal = normalize(vec3(-dhdx * u_normalIntensity, -dhdy * u_normalIntensity, 1.0));
                
                // Apply DirectX vs OpenGL normal map format
                if (u_isDirectXNormal) {
                    // DirectX: Y points up, invert Y component
                    normal.y = -normal.y;
                }
                
                // Convert to normal map format [0,1] range
                return normal * 0.5 + 0.5;
            }
            
            // Calculate height directly for height map mode
            float calculateHeight(vec2 uv) {
                float totalHeight = 0.0;
                float minHeight = 0.0;
                float maxHeight = 0.0;
                
                for (int i = 0; i < 8; i++) {
                    if (i >= u_layerCount) break;
                    
                    float componentHeight = fourierComponent(uv, 
                                                           u_amplitudes[i], u_spatialFreqs[i], u_temporalFreqs[i], 
                                                           u_directions[i], u_phases[i], u_time, u_sharpnesses[i]);
                    totalHeight += componentHeight;
                    
                    // Track theoretical min/max for normalization
                    if (u_normalizeHeights) {
                        minHeight -= abs(u_amplitudes[i]); // Worst case negative
                        maxHeight += abs(u_amplitudes[i]); // Worst case positive
                    }
                }
                
                // Apply wave scale
                totalHeight *= u_waveScale;
                
                // Optional height normalization to ensure full [0,1] range usage
                if (u_normalizeHeights && abs(maxHeight - minHeight) > 0.001) {
                    minHeight *= u_waveScale;
                    maxHeight *= u_waveScale;
                    // Normalize to [-1, 1] range first, then will be mapped to [0,1] in main()
                    totalHeight = 2.0 * (totalHeight - minHeight) / (maxHeight - minHeight) - 1.0;
                }
                
                return totalHeight;
            }
            
            void main() {
                // Apply tiling preview to UV coordinates
                vec2 tiledUV = fract(v_uv * u_tilingPreview);
                
                if (u_outputMode == 0) {
                    // Normal map mode
                    vec3 normal = calculateNormal(tiledUV, 0.0); // Epsilon no longer used for analytical derivatives
                    gl_FragColor = vec4(normal, 1.0);
                } else {
                    // Height map mode
                    float height = calculateHeight(tiledUV);
                    
                    // Normalize height to 0-1 range
                    float normalizedHeight = (height * u_heightRange + 1.0) * 0.5;
                    normalizedHeight = clamp(normalizedHeight, 0.0, 1.0);
                    
                    // Output as grayscale
                    gl_FragColor = vec4(normalizedHeight, normalizedHeight, normalizedHeight, 1.0);
                }
            }
        `;
        
        this.vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
        this.fragmentShader = this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
        
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, this.vertexShader);
        this.gl.attachShader(this.program, this.fragmentShader);
        this.gl.linkProgram(this.program);
        
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            throw new Error('Shader program failed to link: ' + this.gl.getProgramInfoLog(this.program));
        }
        
        this.gl.useProgram(this.program);
        
        // Get uniform locations
        this.uniforms = {
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            loopDuration: this.gl.getUniformLocation(this.program, 'u_loopDuration'),
            waveScale: this.gl.getUniformLocation(this.program, 'u_waveScale'),
            normalIntensity: this.gl.getUniformLocation(this.program, 'u_normalIntensity'),
            heightRange: this.gl.getUniformLocation(this.program, 'u_heightRange'),
            outputMode: this.gl.getUniformLocation(this.program, 'u_outputMode'),
            normalizeHeights: this.gl.getUniformLocation(this.program, 'u_normalizeHeights'),
            isDirectXNormal: this.gl.getUniformLocation(this.program, 'u_isDirectXNormal'),
            tilingPreview: this.gl.getUniformLocation(this.program, 'u_tilingPreview'),
            layerCount: this.gl.getUniformLocation(this.program, 'u_layerCount'),
            amplitudes: this.gl.getUniformLocation(this.program, 'u_amplitudes'),
            spatialFreqs: this.gl.getUniformLocation(this.program, 'u_spatialFreqs'),
            temporalFreqs: this.gl.getUniformLocation(this.program, 'u_temporalFreqs'),
            directions: this.gl.getUniformLocation(this.program, 'u_directions'),
            phases: this.gl.getUniformLocation(this.program, 'u_phases'),
            sharpnesses: this.gl.getUniformLocation(this.program, 'u_sharpnesses')
        };
        
        // Get attribute locations
        this.attributes = {
            position: this.gl.getAttribLocation(this.program, 'a_position')
        };
    }
    
    compileShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            throw new Error('Shader compilation failed: ' + this.gl.getShaderInfoLog(shader));
        }
        
        return shader;
    }
    
    setupGeometry() {
        // Full-screen quad vertices
        const vertices = new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
             1.0,  1.0
        ]);
        
        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
        
        this.gl.enableVertexAttribArray(this.attributes.position);
        this.gl.vertexAttribPointer(this.attributes.position, 2, this.gl.FLOAT, false, 0, 0);
    }
    
    setupUI() {
        // Restore UI controls from saved settings
        this.restoreUIControls();
        
        // Randomize buttons (both mobile and desktop)
        const randomizeAllBtnEl = document.getElementById('randomizeAllBtn');
        const randomizeAllBtnMobileEl = document.getElementById('randomizeAllBtnMobile');
        
        const handleRandomize = () => {
            this.randomizeAllLayers();
            this.updateWaveLayerControls();
            this.saveSettings();
        };

        if (randomizeAllBtnEl) {
            randomizeAllBtnEl.addEventListener('click', handleRandomize);
        }
        
        if (randomizeAllBtnMobileEl) {
            randomizeAllBtnMobileEl.addEventListener('click', handleRandomize);
        }
        
        // Animation controls
        const loopDurationEl = document.getElementById('loopDuration');
        if (loopDurationEl) {
            loopDurationEl.addEventListener('input', (e) => {
                this.loopDuration = parseFloat(e.target.value);
                this.saveSettings();
            });
        }
        
        const speedEl = document.getElementById('speed');
        if (speedEl) {
            speedEl.addEventListener('input', (e) => {
                this.speed = parseFloat(e.target.value);
                const speedValueEl = document.getElementById('speedValue');
                if (speedValueEl) speedValueEl.textContent = this.speed.toFixed(1);
                this.saveSettings();
            });
        }
        
        const layerCountEl = document.getElementById('layerCount');
        if (layerCountEl) {
            layerCountEl.addEventListener('input', (e) => {
                this.layerCount = parseInt(e.target.value);
                const layerCountValueEl = document.getElementById('layerCountValue');
                if (layerCountValueEl) layerCountValueEl.textContent = this.layerCount.toString();
                this.updateWaveLayerControls();
                this.saveSettings();
            });
        }
        
        // Output mode controls
        const outputModeEl = document.getElementById('outputMode');
        if (outputModeEl) {
            outputModeEl.addEventListener('change', (e) => {
                this.outputMode = e.target.value;
                this.updateModeUI();
                this.saveSettings();
            });
        }
        
        // Global settings
        const waveScaleEl = document.getElementById('waveScale');
        if (waveScaleEl) {
            waveScaleEl.addEventListener('input', (e) => {
                this.waveScale = parseFloat(e.target.value);
                const waveScaleValueEl = document.getElementById('waveScaleValue');
                if (waveScaleValueEl) waveScaleValueEl.textContent = this.waveScale.toFixed(1);
                this.saveSettings();
            });
        }
        
        const normalIntensityEl = document.getElementById('normalIntensity');
        if (normalIntensityEl) {
            normalIntensityEl.addEventListener('input', (e) => {
                this.normalIntensity = parseFloat(e.target.value);
                const normalIntensityValueEl = document.getElementById('normalIntensityValue');
                if (normalIntensityValueEl) normalIntensityValueEl.textContent = this.normalIntensity.toFixed(1);
                this.saveSettings();
            });
        }
        
        const heightRangeEl = document.getElementById('heightRange');
        if (heightRangeEl) {
            heightRangeEl.addEventListener('input', (e) => {
                this.heightRange = parseFloat(e.target.value);
                const heightRangeValueEl = document.getElementById('heightRangeValue');
                if (heightRangeValueEl) heightRangeValueEl.textContent = this.heightRange.toFixed(1);
                this.saveSettings();
            });
        }
        
        const normalizeHeightsEl = document.getElementById('normalizeHeights');
        if (normalizeHeightsEl) {
            normalizeHeightsEl.addEventListener('change', (e) => {
                this.normalizeHeights = e.target.checked;
                this.saveSettings();
            });
        }
        
        const normalMapFormatEl = document.getElementById('normalMapFormat');
        if (normalMapFormatEl) {
            normalMapFormatEl.addEventListener('change', (e) => {
                this.normalMapFormat = e.target.value;
                this.saveSettings();
            });
        }
        
        const tilingPreviewEl = document.getElementById('tilingPreview');
        if (tilingPreviewEl) {
            tilingPreviewEl.addEventListener('input', (e) => {
                this.tilingPreview = parseInt(e.target.value);
                const tilingPreviewValueEl = document.getElementById('tilingPreviewValue');
                if (tilingPreviewValueEl) tilingPreviewValueEl.textContent = this.tilingPreview.toString();
                this.saveSettings();
            });
        }
        
        // Export controls
        const exportBtnEl = document.getElementById('exportBtn');
        if (exportBtnEl) {
            exportBtnEl.addEventListener('click', () => {
                this.exportImageSequence();
            });
        }
        
        // Export settings
        const exportResEl = document.getElementById('exportRes');
        if (exportResEl) {
            exportResEl.addEventListener('change', (e) => {
                this.saveSettings();
            });
        }
        
        const exportFramesEl = document.getElementById('exportFrames');
        if (exportFramesEl) {
            exportFramesEl.addEventListener('input', (e) => {
                this.saveSettings();
            });
        }
        
        // Preset controls
        const exportPresetBtnEl = document.getElementById('exportPresetBtn');
        if (exportPresetBtnEl) {
            exportPresetBtnEl.addEventListener('click', () => {
                this.exportPreset();
            });
        }
        
        const importPresetBtnEl = document.getElementById('importPresetBtn');
        if (importPresetBtnEl) {
            importPresetBtnEl.addEventListener('click', () => {
                const importPresetFileEl = document.getElementById('importPresetFile');
                if (importPresetFileEl) importPresetFileEl.click();
            });
        }
        
        const importPresetFileEl = document.getElementById('importPresetFile');
        if (importPresetFileEl) {
            importPresetFileEl.addEventListener('change', (e) => {
                this.importPreset(e.target.files[0]);
            });
        }
        
        this.updateModeUI();
    }
    
    updateModeUI() {
        const normalIntensityRow = document.getElementById('normalIntensityRow');
        const heightRangeRow = document.getElementById('heightRangeRow');
        const normalizeHeightsRow = document.getElementById('normalizeHeightsRow');
        const normalMapFormatRow = document.getElementById('normalMapFormatRow');
        
        if (this.outputMode === 'normal') {
            normalIntensityRow.style.display = 'flex';
            heightRangeRow.style.display = 'none';
            normalizeHeightsRow.style.display = 'none';
            if (normalMapFormatRow) normalMapFormatRow.style.display = 'flex';
        } else {
            normalIntensityRow.style.display = 'none';
            heightRangeRow.style.display = 'flex';
            normalizeHeightsRow.style.display = 'flex';
            if (normalMapFormatRow) normalMapFormatRow.style.display = 'none';
        }
    }
    
    generateRandomWaveLayer() {
        return {
            amplitude: Math.random() * 0.8 + 0.1,       // 0.1 to 0.9
            spatialFreq: Math.random() * 3 + 0.2,       // 0.2 to 3.2
            temporalFreq: Math.floor(Math.random() * 8) + 1, // 1 to 8 (integers for perfect looping)
            direction: { 
                x: (Math.random() - 0.5) * 2,           // -1 to 1
                y: (Math.random() - 0.5) * 2            // -1 to 1
            },
            phase: Math.random() * 2 * Math.PI,         // 0 to 2π
            sharpness: Math.random() * 0.5,             // 0 to 0.5 (moderate sharpness)
            locked: {
                amplitude: false, spatialFreq: false, temporalFreq: false,
                direction: false, phase: false, sharpness: false
            }
        };
    }
    
    randomizeLayer(index) {
        if (index >= 0 && index < this.waveLayers.length) {
            const layer = this.waveLayers[index];
            const newLayer = this.generateRandomWaveLayer();
            
            // Only randomize unlocked parameters
            if (!layer.locked.amplitude) layer.amplitude = newLayer.amplitude;
            if (!layer.locked.spatialFreq) layer.spatialFreq = newLayer.spatialFreq;
            if (!layer.locked.temporalFreq) layer.temporalFreq = newLayer.temporalFreq;
            if (!layer.locked.direction) {
                layer.direction.x = newLayer.direction.x;
                layer.direction.y = newLayer.direction.y;
            }
            if (!layer.locked.phase) layer.phase = newLayer.phase;
            if (!layer.locked.sharpness) layer.sharpness = newLayer.sharpness;
            
            this.updateWaveLayerControls();
            this.saveSettings();
        }
    }
    
    randomizeAllLayers() {
        for (let i = 0; i < this.layerCount; i++) {
            const layer = this.waveLayers[i];
            const newLayer = this.generateRandomWaveLayer();
            
            // Only randomize unlocked parameters
            if (!layer.locked.amplitude) layer.amplitude = newLayer.amplitude;
            if (!layer.locked.spatialFreq) layer.spatialFreq = newLayer.spatialFreq;
            if (!layer.locked.temporalFreq) layer.temporalFreq = newLayer.temporalFreq;
            if (!layer.locked.direction) {
                layer.direction.x = newLayer.direction.x;
                layer.direction.y = newLayer.direction.y;
            }
            if (!layer.locked.phase) layer.phase = newLayer.phase;
            if (!layer.locked.sharpness) layer.sharpness = newLayer.sharpness;
        }
        this.updateWaveLayerControls();
        this.saveSettings();
    }
    
    updateWaveLayerControls() {
        const container = document.getElementById('waveLayers');
        container.innerHTML = '';
        
        // Ensure we have enough wave layers
        while (this.waveLayers.length < this.layerCount) {
            this.waveLayers.push({
                amplitude: 0.1,
                spatialFreq: 1.0,
                temporalFreq: 1,
                direction: { x: 1.0, y: 0.0 },
                phase: 0.0,
                sharpness: 0.0,
                locked: {
                    amplitude: false, spatialFreq: false, temporalFreq: false,
                    direction: false, phase: false, sharpness: false
                }
            });
        }
        
        for (let i = 0; i < this.layerCount; i++) {
            const layer = this.waveLayers[i];
            const layerDiv = document.createElement('div');
            layerDiv.className = 'wave-layer';
            layerDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0;">Fourier Component ${i + 1}</h4>
                    <button class="randomize-layer-btn" id="randomizeLayer${i}" style="padding: 4px 8px; font-size: 11px; width: auto;"><i class="fas fa-shuffle"></i> Randomize</button>
                </div>
                <div class="control-row">
                    <label>Amplitude:</label>
                    <div class="slider-container">
                        <button class="lock-btn" id="lockAmplitude${i}" data-param="amplitude" data-layer="${i}" style="background: none; border: none; color: ${layer.locked.amplitude ? 'white' : '#888'}; padding: 2px; margin-right: 5px; font-size: 14px; cursor: pointer; width: 20px;"><i class="fas ${layer.locked.amplitude ? 'fa-lock' : 'fa-unlock'}"></i></button>
                        <input type="range" min="0.01" max="1.0" step="0.01" value="${layer.amplitude}" id="amplitude${i}">
                        <span class="value-display" id="amplitudeValue${i}">${layer.amplitude.toFixed(2)}</span>
                    </div>
                </div>
                <div class="control-row">
                    <label>Spatial Frequency:</label>
                    <div class="slider-container">
                        <button class="lock-btn" id="lockSpatialFreq${i}" data-param="spatialFreq" data-layer="${i}" style="background: none; border: none; color: ${layer.locked.spatialFreq ? 'white' : '#888'}; padding: 2px; margin-right: 5px; font-size: 14px; cursor: pointer; width: 20px;"><i class="fas ${layer.locked.spatialFreq ? 'fa-lock' : 'fa-unlock'}"></i></button>
                        <input type="range" min="0.1" max="5.0" step="0.1" value="${layer.spatialFreq}" id="spatialFreq${i}">
                        <span class="value-display" id="spatialFreqValue${i}">${layer.spatialFreq.toFixed(1)}</span>
                    </div>
                </div>
                <div class="control-row">
                    <label>Temporal Frequency:</label>
                    <div class="slider-container">
                        <button class="lock-btn" id="lockTemporalFreq${i}" data-param="temporalFreq" data-layer="${i}" style="background: none; border: none; color: ${layer.locked.temporalFreq ? 'white' : '#888'}; padding: 2px; margin-right: 5px; font-size: 14px; cursor: pointer; width: 20px;"><i class="fas ${layer.locked.temporalFreq ? 'fa-lock' : 'fa-unlock'}"></i></button>
                        <input type="range" min="1" max="16" step="1" value="${layer.temporalFreq}" id="temporalFreq${i}">
                        <span class="value-display" id="temporalFreqValue${i}">${layer.temporalFreq}</span>
                    </div>
                </div>
                <div class="control-row">
                    <label>Direction X:</label>
                    <div class="slider-container">
                        <button class="lock-btn" id="lockDirectionX${i}" data-param="direction" data-layer="${i}" style="background: none; border: none; color: ${layer.locked.direction ? 'white' : '#888'}; padding: 2px; margin-right: 5px; font-size: 14px; cursor: pointer; width: 20px;"><i class="fas ${layer.locked.direction ? 'fa-lock' : 'fa-unlock'}"></i></button>
                        <input type="range" min="-1.0" max="1.0" step="0.1" value="${layer.direction.x}" id="directionX${i}">
                        <span class="value-display" id="directionXValue${i}">${layer.direction.x.toFixed(1)}</span>
                    </div>
                </div>
                <div class="control-row">
                    <label>Direction Y:</label>
                    <div class="slider-container">
                        <button class="lock-btn" id="lockDirectionY${i}" data-param="direction" data-layer="${i}" style="background: none; border: none; color: ${layer.locked.direction ? 'white' : '#888'}; padding: 2px; margin-right: 5px; font-size: 14px; cursor: pointer; width: 20px;"><i class="fas ${layer.locked.direction ? 'fa-lock' : 'fa-unlock'}"></i></button>
                        <input type="range" min="-1.0" max="1.0" step="0.1" value="${layer.direction.y}" id="directionY${i}">
                        <span class="value-display" id="directionYValue${i}">${layer.direction.y.toFixed(1)}</span>
                    </div>
                </div>
                <div class="control-row">
                    <label>Phase:</label>
                    <div class="slider-container">
                        <button class="lock-btn" id="lockPhase${i}" data-param="phase" data-layer="${i}" style="background: none; border: none; color: ${layer.locked.phase ? 'white' : '#888'}; padding: 2px; margin-right: 5px; font-size: 14px; cursor: pointer; width: 20px;"><i class="fas ${layer.locked.phase ? 'fa-lock' : 'fa-unlock'}"></i></button>
                        <input type="range" min="0.0" max="6.28" step="0.1" value="${layer.phase}" id="phase${i}">
                        <span class="value-display" id="phaseValue${i}">${layer.phase.toFixed(1)}</span>
                    </div>
                </div>
                <div class="control-row">
                    <label>Sharpness:</label>
                    <div class="slider-container">
                        <button class="lock-btn" id="lockSharpness${i}" data-param="sharpness" data-layer="${i}" style="background: none; border: none; color: ${layer.locked.sharpness ? 'white' : '#888'}; padding: 2px; margin-right: 5px; font-size: 14px; cursor: pointer; width: 20px;"><i class="fas ${layer.locked.sharpness ? 'fa-lock' : 'fa-unlock'}"></i></button>
                        <input type="range" min="0.0" max="1.0" step="0.1" value="${layer.sharpness}" id="sharpness${i}">
                        <span class="value-display" id="sharpnessValue${i}">${layer.sharpness.toFixed(1)}</span>
                    </div>
                </div>
            `;
            container.appendChild(layerDiv);
            
            // Explicitly set input values after DOM insertion to ensure they're applied
            const amplitudeInput = document.getElementById(`amplitude${i}`);
            const spatialFreqInput = document.getElementById(`spatialFreq${i}`);
            const temporalFreqInput = document.getElementById(`temporalFreq${i}`);
            const directionXInput = document.getElementById(`directionX${i}`);
            const directionYInput = document.getElementById(`directionY${i}`);
            const phaseInput = document.getElementById(`phase${i}`);
            const sharpnessInput = document.getElementById(`sharpness${i}`);
            
            // Set values explicitly
            amplitudeInput.value = layer.amplitude;
            spatialFreqInput.value = layer.spatialFreq;
            temporalFreqInput.value = layer.temporalFreq;
            directionXInput.value = layer.direction.x;
            directionYInput.value = layer.direction.y;
            phaseInput.value = layer.phase;
            sharpnessInput.value = layer.sharpness;
            
            // Update display values
            document.getElementById(`amplitudeValue${i}`).textContent = layer.amplitude.toFixed(2);
            document.getElementById(`spatialFreqValue${i}`).textContent = layer.spatialFreq.toFixed(1);
            document.getElementById(`temporalFreqValue${i}`).textContent = layer.temporalFreq.toString();
            document.getElementById(`directionXValue${i}`).textContent = layer.direction.x.toFixed(1);
            document.getElementById(`directionYValue${i}`).textContent = layer.direction.y.toFixed(1);
            document.getElementById(`phaseValue${i}`).textContent = layer.phase.toFixed(1);
            document.getElementById(`sharpnessValue${i}`).textContent = layer.sharpness.toFixed(1);
            
            // Add event listeners
            amplitudeInput.addEventListener('input', (e) => {
                layer.amplitude = parseFloat(e.target.value);
                document.getElementById(`amplitudeValue${i}`).textContent = layer.amplitude.toFixed(2);
                this.saveSettings();
            });
            
            spatialFreqInput.addEventListener('input', (e) => {
                layer.spatialFreq = parseFloat(e.target.value);
                document.getElementById(`spatialFreqValue${i}`).textContent = layer.spatialFreq.toFixed(1);
                this.saveSettings();
            });
            
            temporalFreqInput.addEventListener('input', (e) => {
                layer.temporalFreq = parseInt(e.target.value);
                document.getElementById(`temporalFreqValue${i}`).textContent = layer.temporalFreq.toString();
                this.saveSettings();
            });
            
            directionXInput.addEventListener('input', (e) => {
                layer.direction.x = parseFloat(e.target.value);
                document.getElementById(`directionXValue${i}`).textContent = layer.direction.x.toFixed(1);
                this.saveSettings();
            });
            
            directionYInput.addEventListener('input', (e) => {
                layer.direction.y = parseFloat(e.target.value);
                document.getElementById(`directionYValue${i}`).textContent = layer.direction.y.toFixed(1);
                this.saveSettings();
            });
            
            phaseInput.addEventListener('input', (e) => {
                layer.phase = parseFloat(e.target.value);
                document.getElementById(`phaseValue${i}`).textContent = layer.phase.toFixed(1);
                this.saveSettings();
            });
            
            sharpnessInput.addEventListener('input', (e) => {
                layer.sharpness = parseFloat(e.target.value);
                document.getElementById(`sharpnessValue${i}`).textContent = layer.sharpness.toFixed(1);
                this.saveSettings();
            });
            
            // Randomize button for this layer
            document.getElementById(`randomizeLayer${i}`).addEventListener('click', () => {
                this.randomizeLayer(i);
                this.saveSettings();
            });
            
            // Lock button event listeners
            const lockButtons = [
                { id: `lockAmplitude${i}`, param: 'amplitude' },
                { id: `lockSpatialFreq${i}`, param: 'spatialFreq' },
                { id: `lockTemporalFreq${i}`, param: 'temporalFreq' },
                { id: `lockDirectionX${i}`, param: 'direction' },
                { id: `lockDirectionY${i}`, param: 'direction' },
                { id: `lockPhase${i}`, param: 'phase' },
                { id: `lockSharpness${i}`, param: 'sharpness' }
            ];
            
            lockButtons.forEach(({ id, param }) => {
                const lockBtn = document.getElementById(id);
                if (lockBtn) {
                    lockBtn.addEventListener('click', () => {
                        // Toggle lock state
                        layer.locked[param] = !layer.locked[param];
                        
                        // Update button appearance
                        lockBtn.innerHTML = `<i class="fas ${layer.locked[param] ? 'fa-lock' : 'fa-unlock'}"></i>`;
                        lockBtn.style.color = layer.locked[param] ? 'white' : '#888';
                        
                        this.saveSettings();
                    });
                }
            });

        }
    }
    
    updateUniforms() {
        // Send normalized time [0,1] to shader for perfect looping
        const normalizedTime = this.currentTime / this.loopDuration;
        this.gl.uniform1f(this.uniforms.time, normalizedTime);
        this.gl.uniform1f(this.uniforms.loopDuration, this.loopDuration);
        this.gl.uniform1f(this.uniforms.waveScale, this.waveScale);
        this.gl.uniform1f(this.uniforms.normalIntensity, this.normalIntensity);
        this.gl.uniform1f(this.uniforms.heightRange, this.heightRange);
        this.gl.uniform1i(this.uniforms.outputMode, this.outputMode === 'normal' ? 0 : 1);
        this.gl.uniform1i(this.uniforms.normalizeHeights, this.normalizeHeights ? 1 : 0);
        this.gl.uniform1i(this.uniforms.isDirectXNormal, this.normalMapFormat === 'directx' ? 1 : 0);
        this.gl.uniform1f(this.uniforms.tilingPreview, this.tilingPreview);
        this.gl.uniform1i(this.uniforms.layerCount, this.layerCount);
        
        // Fourier wave layer parameters
        const amplitudes = new Float32Array(8);
        const spatialFreqs = new Float32Array(8);
        const temporalFreqs = new Float32Array(8);
        const directions = new Float32Array(16); // 8 vec2s
        const phases = new Float32Array(8);
        const sharpnesses = new Float32Array(8);
        
        for (let i = 0; i < Math.min(8, this.layerCount); i++) {
            const layer = this.waveLayers[i];
            amplitudes[i] = layer.amplitude;
            spatialFreqs[i] = layer.spatialFreq;
            temporalFreqs[i] = layer.temporalFreq;
            directions[i * 2] = layer.direction.x;
            directions[i * 2 + 1] = layer.direction.y;
            phases[i] = layer.phase;
            sharpnesses[i] = layer.sharpness;
        }
        
        this.gl.uniform1fv(this.uniforms.amplitudes, amplitudes);
        this.gl.uniform1fv(this.uniforms.spatialFreqs, spatialFreqs);
        this.gl.uniform1fv(this.uniforms.temporalFreqs, temporalFreqs);
        this.gl.uniform2fv(this.uniforms.directions, directions);
        this.gl.uniform1fv(this.uniforms.phases, phases);
        this.gl.uniform1fv(this.uniforms.sharpnesses, sharpnesses);
    }
    
    render() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.updateUniforms();
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    
    updateTime() {
        if (this.isPlaying) {
            const now = performance.now();
            const deltaTime = (now - this.startTime) / 1000.0 * this.speed;
            this.currentTime = deltaTime % this.loopDuration;
            
            // Update UI
            document.getElementById('time').textContent = this.currentTime.toFixed(2);
            
            // Calculate FPS
            if (now - this.lastFrameTime >= 1000) {
                this.fps = Math.round(this.frameCount * 1000 / (now - this.lastFrameTime));
                document.getElementById('fps').textContent = this.fps;
                this.frameCount = 0;
                this.lastFrameTime = now;
            }
            this.frameCount++;
        }
    }
    
    startAnimation() {
        const animate = () => {
            this.updateTime();
            this.render();
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    async exportImageSequence() {
        const exportBtn = document.getElementById('exportBtn');
        const progressFill = document.getElementById('exportProgress');
        const exportRes = parseInt(document.getElementById('exportRes').value);
        const exportFrames = parseInt(document.getElementById('exportFrames').value);
        
        exportBtn.disabled = true;
        exportBtn.textContent = 'Creating ZIP...';
        
        // Create off-screen canvas for export
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = exportRes;
        exportCanvas.height = exportRes;
        const exportGL = exportCanvas.getContext('webgl2') || exportCanvas.getContext('webgl');
        
        if (!exportGL) {
            alert('WebGL not supported for export');
            return;
        }
        
        // Setup export WebGL context
        this.setupExportGL(exportGL, exportRes);
        
        const images = [];
        const originalTime = this.currentTime;
        
        for (let frame = 0; frame < exportFrames; frame++) {
            // Calculate frame time
            const frameTime = (frame / exportFrames) * this.loopDuration;
            this.currentTime = frameTime;
            
            // Render frame
            exportGL.clear(exportGL.COLOR_BUFFER_BIT);
            this.updateExportUniforms(exportGL);
            exportGL.drawArrays(exportGL.TRIANGLE_STRIP, 0, 4);
            
            // Convert to blob
            const blob = await new Promise(resolve => {
                exportCanvas.toBlob(resolve, 'image/png');
            });
            
            images.push(blob);
            
            // Update progress
            const progress = ((frame + 1) / exportFrames) * 100;
            progressFill.style.width = progress + '%';
            
            // Allow UI to update
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        // Restore original time
        this.currentTime = originalTime;
        
        // Download as zip
        await this.downloadAsZip(images);
        
        exportBtn.disabled = false;
        exportBtn.textContent = 'Export as ZIP';
        progressFill.style.width = '0%';
    }
    
    setupExportGL(gl, resolution) {
        gl.viewport(0, 0, resolution, resolution);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        
        // Create shaders for export context
        const vertexShader = this.compileShaderForGL(gl, `
            attribute vec2 a_position;
            varying vec2 v_uv;
            void main() {
                v_uv = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `, gl.VERTEX_SHADER);
        
        const fragmentShader = this.compileShaderForGL(gl, `
            precision highp float;
            varying vec2 v_uv;
            uniform float u_time;
            uniform float u_loopDuration;
            uniform float u_waveScale;
            uniform float u_normalIntensity;
            uniform float u_heightRange;
            uniform int u_outputMode;
            uniform bool u_normalizeHeights;
            uniform bool u_isDirectXNormal; // true = DirectX, false = OpenGL
            uniform float u_tilingPreview; // Number of tiles to show for preview
            uniform int u_layerCount;
            uniform float u_amplitudes[8];
            uniform float u_spatialFreqs[8];
            uniform float u_temporalFreqs[8];
            uniform vec2 u_directions[8];
            uniform float u_phases[8];
            uniform float u_sharpnesses[8];
            
            // WebGL-compatible round function
            float roundCompat(float x) {
                return floor(x + 0.5);
            }
            
            // Wave sharpening function using the complete mathematical formula
            // Creates oscilloscope-like waveforms with sharp valleys and flat, shaped peaks
            float sharpenWave(float wave, float sharpness) {
                if (sharpness <= 0.001) {
                    return wave;
                }
                
                // Convert sharpness [0,1] to power parameter p
                // Higher sharpness = lower p = more dramatic shaping
                float p = 1.0 / (1.0 + sharpness * 4.0); // Range: p from 1.0 to 0.2
                
                // Step 1: Flip the wave to target valleys instead of peaks
                float y0 = -wave;
                
                // Step 2: Shift to negative space
                float y1 = y0 - 1.0; // Range: [-2, 0]
                
                // Step 3: Apply power function in negative space
                // y2 = -((-y1)^(1/p))
                float y2 = -pow(-y1, 1.0 / p);
                
                // Step 4: Shift back to center around zero
                float y3 = y2 + 1.0;
                
                // Step 5: Normalize back to [-1, 1] range
                // For this specific function, we can calculate the range analytically
                // When y1 = -2 (wave = -1): y2 = -pow(2, 1/p), y3 = 1 - pow(2, 1/p)
                // When y1 = 0 (wave = 1): y2 = 0, y3 = 1
                float minY3 = 1.0 - pow(2.0, 1.0 / p);
                float maxY3 = 1.0;
                float y4 = 2.0 * (y3 - minY3) / (maxY3 - minY3) - 1.0;
                
                // Step 6: Flip back to restore original orientation (now valleys are sharp)
                float y5 = -y4;
                
                // Blend between original wave and sharpened wave based on sharpness parameter
                return mix(wave, y5, sharpness);
            }
            
            float fourierComponent(vec2 uv, float amplitude, float spatialFreq, float temporalFreq, 
                                 vec2 direction, float phaseOffset, float time, float sharpness) {
                // Normalize direction
                vec2 dir = normalize(direction);
                
                // For seamless tiling, work directly with UV coordinates [0,1]
                // and ensure wave vectors create integer cycles across the tile
                
                // Quantize the wave vector components to ensure seamless tiling
                // Each component should complete integer cycles across [0,1]
                float kx = roundCompat(spatialFreq * dir.x) * 2.0 * 3.14159;
                float ky = roundCompat(spatialFreq * dir.y) * 2.0 * 3.14159;
                vec2 k = vec2(kx, ky);
                
                // Use UV coordinates directly for spatial phase
                float spatialPhase = dot(k, uv);
                
                // Temporal phase: ω * t (ω is integer for perfect looping)
                float temporalPhase = temporalFreq * 2.0 * 3.14159 * time;
                
                // Total phase
                float phase = spatialPhase + temporalPhase + phaseOffset;
                
                // Generate base sine wave
                float wave = sin(phase);
                
                // Apply wave sharpening for more realistic wave shapes
                float sharpenedWave = sharpenWave(wave, sharpness);
                
                // Return amplified component
                return amplitude * sharpenedWave;
            }
            
            vec3 calculateNormal(vec2 uv, float epsilon) {
                float dhdx = 0.0;
                float dhdy = 0.0;
                
                // Calculate analytical derivatives directly from Fourier components
                for (int i = 0; i < 8; i++) {
                    if (i >= u_layerCount) break;
                    
                    float amplitude = u_amplitudes[i];
                    float spatialFreq = u_spatialFreqs[i];
                    float temporalFreq = u_temporalFreqs[i];
                    vec2 direction = normalize(u_directions[i]);
                    float phaseOffset = u_phases[i];
                    float sharpness = u_sharpnesses[i];
                    
                    // Quantized wave vector for seamless tiling
                    float kx = roundCompat(spatialFreq * direction.x) * 2.0 * 3.14159;
                    float ky = roundCompat(spatialFreq * direction.y) * 2.0 * 3.14159;
                    
                    // Phase calculation
                    float spatialPhase = kx * uv.x + ky * uv.y;
                    float temporalPhase = temporalFreq * 2.0 * 3.14159 * u_time;
                    float totalPhase = spatialPhase + temporalPhase + phaseOffset;
                    
                    // Base wave and its derivative
                    float wave = sin(totalPhase);
                    float waveDerivative = cos(totalPhase);
                    
                    // Apply sharpening to both wave and derivative
                    float sharpenedWave = sharpenWave(wave, sharpness);
                    
                    // For the derivative, we need to account for the sharpening transformation
                    float sharpenedDerivative = waveDerivative;
                    if (sharpness > 0.001) {
                        // Approximate the derivative of the sharpened wave
                        float p = 1.0 / (1.0 + sharpness * 4.0);
                        float y0 = -wave;
                        float y1 = y0 - 1.0;
                        if (abs(y1) > 0.001) {
                            float derivativeScale = (1.0 / p) * pow(abs(y1), (1.0 / p) - 1.0);
                            sharpenedDerivative = mix(waveDerivative, -waveDerivative * derivativeScale, sharpness);
                        }
                    }
                    
                    // Accumulate gradients
                    dhdx += amplitude * sharpenedDerivative * kx;
                    dhdy += amplitude * sharpenedDerivative * ky;
                }
                
                // Apply wave scale
                dhdx *= u_waveScale;
                dhdy *= u_waveScale;
                
                // Normal vector
                vec3 normal = normalize(vec3(-dhdx * u_normalIntensity, -dhdy * u_normalIntensity, 1.0));
                
                // Apply DirectX vs OpenGL normal map format
                if (u_isDirectXNormal) {
                    // DirectX: Y points up, invert Y component
                    normal.y = -normal.y;
                }
                
                // Convert to normal map format [0,1] range
                return normal * 0.5 + 0.5;
            }
            
            float calculateHeight(vec2 uv) {
                float totalHeight = 0.0;
                float minHeight = 0.0;
                float maxHeight = 0.0;
                
                for (int i = 0; i < 8; i++) {
                    if (i >= u_layerCount) break;
                    
                    float componentHeight = fourierComponent(uv, 
                                                           u_amplitudes[i], u_spatialFreqs[i], u_temporalFreqs[i], 
                                                           u_directions[i], u_phases[i], u_time, u_sharpnesses[i]);
                    totalHeight += componentHeight;
                    
                    // Track theoretical min/max for normalization
                    if (u_normalizeHeights) {
                        minHeight -= abs(u_amplitudes[i]); // Worst case negative
                        maxHeight += abs(u_amplitudes[i]); // Worst case positive
                    }
                }
                
                // Apply wave scale
                totalHeight *= u_waveScale;
                
                // Optional height normalization to ensure full [0,1] range usage
                if (u_normalizeHeights && abs(maxHeight - minHeight) > 0.001) {
                    minHeight *= u_waveScale;
                    maxHeight *= u_waveScale;
                    // Normalize to [-1, 1] range first, then will be mapped to [0,1] in main()
                    totalHeight = 2.0 * (totalHeight - minHeight) / (maxHeight - minHeight) - 1.0;
                }
                
                return totalHeight;
            }
            
            void main() {
                // Apply tiling preview to UV coordinates (for export, this should always be 1)
                vec2 tiledUV = fract(v_uv * u_tilingPreview);
                
                if (u_outputMode == 0) {
                    // Normal map mode
                    vec3 normal = calculateNormal(tiledUV, 0.0); // Epsilon no longer used for analytical derivatives
                    gl_FragColor = vec4(normal, 1.0);
                } else {
                    // Height map mode
                    float height = calculateHeight(tiledUV);
                    
                    // Normalize height to 0-1 range
                    float normalizedHeight = (height * u_heightRange + 1.0) * 0.5;
                    normalizedHeight = clamp(normalizedHeight, 0.0, 1.0);
                    
                    // Output as grayscale
                    gl_FragColor = vec4(normalizedHeight, normalizedHeight, normalizedHeight, 1.0);
                }
            }
        `, gl.FRAGMENT_SHADER);
        
        this.exportProgram = gl.createProgram();
        gl.attachShader(this.exportProgram, vertexShader);
        gl.attachShader(this.exportProgram, fragmentShader);
        gl.linkProgram(this.exportProgram);
        
        if (!gl.getProgramParameter(this.exportProgram, gl.LINK_STATUS)) {
            throw new Error('Export shader program failed to link');
        }
        
        gl.useProgram(this.exportProgram);
        
        // Get uniform locations
        this.exportUniforms = {
            time: gl.getUniformLocation(this.exportProgram, 'u_time'),
            loopDuration: gl.getUniformLocation(this.exportProgram, 'u_loopDuration'),
            waveScale: gl.getUniformLocation(this.exportProgram, 'u_waveScale'),
            normalIntensity: gl.getUniformLocation(this.exportProgram, 'u_normalIntensity'),
            heightRange: gl.getUniformLocation(this.exportProgram, 'u_heightRange'),
            outputMode: gl.getUniformLocation(this.exportProgram, 'u_outputMode'),
            normalizeHeights: gl.getUniformLocation(this.exportProgram, 'u_normalizeHeights'),
            isDirectXNormal: gl.getUniformLocation(this.exportProgram, 'u_isDirectXNormal'),
            tilingPreview: gl.getUniformLocation(this.exportProgram, 'u_tilingPreview'),
            layerCount: gl.getUniformLocation(this.exportProgram, 'u_layerCount'),
            amplitudes: gl.getUniformLocation(this.exportProgram, 'u_amplitudes'),
            spatialFreqs: gl.getUniformLocation(this.exportProgram, 'u_spatialFreqs'),
            temporalFreqs: gl.getUniformLocation(this.exportProgram, 'u_temporalFreqs'),
            directions: gl.getUniformLocation(this.exportProgram, 'u_directions'),
            phases: gl.getUniformLocation(this.exportProgram, 'u_phases'),
            sharpnesses: gl.getUniformLocation(this.exportProgram, 'u_sharpnesses')
        };
        
        // Setup geometry
        const vertices = new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        
        const positionLocation = gl.getAttribLocation(this.exportProgram, 'a_position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        
        this.exportGL = gl;
    }
    
    compileShaderForGL(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error('Export shader compilation failed: ' + gl.getShaderInfoLog(shader));
        }
        
        return shader;
    }
    
    updateExportUniforms(gl) {
        // Send normalized time [0,1] to shader for perfect looping
        const normalizedTime = this.currentTime / this.loopDuration;
        gl.uniform1f(this.exportUniforms.time, normalizedTime);
        gl.uniform1f(this.exportUniforms.loopDuration, this.loopDuration);
        gl.uniform1f(this.exportUniforms.waveScale, this.waveScale);

        gl.uniform1f(this.exportUniforms.normalIntensity, this.normalIntensity);
        gl.uniform1f(this.exportUniforms.heightRange, this.heightRange);
        gl.uniform1i(this.exportUniforms.outputMode, this.outputMode === 'normal' ? 0 : 1);
        gl.uniform1i(this.exportUniforms.normalizeHeights, this.normalizeHeights ? 1 : 0);
        gl.uniform1i(this.exportUniforms.isDirectXNormal, this.normalMapFormat === 'directx' ? 1 : 0);
        gl.uniform1f(this.exportUniforms.tilingPreview, 1.0); // Always 1 for exports (no tiling)
        gl.uniform1i(this.exportUniforms.layerCount, this.layerCount);
        
        const amplitudes = new Float32Array(8);
        const spatialFreqs = new Float32Array(8);
        const temporalFreqs = new Float32Array(8);
        const directions = new Float32Array(16);
        const phases = new Float32Array(8);
        const sharpnesses = new Float32Array(8);
        
        for (let i = 0; i < Math.min(8, this.layerCount); i++) {
            const layer = this.waveLayers[i];
            amplitudes[i] = layer.amplitude;
            spatialFreqs[i] = layer.spatialFreq;
            temporalFreqs[i] = layer.temporalFreq;
            directions[i * 2] = layer.direction.x;
            directions[i * 2 + 1] = layer.direction.y;
            phases[i] = layer.phase;
            sharpnesses[i] = layer.sharpness;
        }
        
        gl.uniform1fv(this.exportUniforms.amplitudes, amplitudes);
        gl.uniform1fv(this.exportUniforms.spatialFreqs, spatialFreqs);
        gl.uniform1fv(this.exportUniforms.temporalFreqs, temporalFreqs);
        gl.uniform2fv(this.exportUniforms.directions, directions);
        gl.uniform1fv(this.exportUniforms.phases, phases);
        gl.uniform1fv(this.exportUniforms.sharpnesses, sharpnesses);
    }
    
    async downloadAsZip(images) {
        try {
            // Create a new zip file
            const zip = new JSZip();
            const modePrefix = this.outputMode === 'normal' ? 'normal' : 'height';
            
            // Add all images to the zip
            for (let i = 0; i < images.length; i++) {
                const fileName = `wave_${modePrefix}_${String(i).padStart(4, '0')}_${Date.now()}.png`;
                zip.file(fileName, images[i]);
            }
            
            // Generate the zip file
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            // Create download link
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fourier_waves_${modePrefix}_${images.length}frames_${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log(`Successfully created zip file with ${images.length} ${modePrefix} map images`);
        } catch (error) {
            console.error('Error creating zip file:', error);
            alert('Error creating zip file. Please try again.');
        }
    }
    
    exportPreset() {
        const preset = {
            version: '1.0',
            name: 'Fourier Wave Preset',
            timestamp: new Date().toISOString(),
            settings: {
                loopDuration: this.loopDuration,
                speed: this.speed,
                layerCount: this.layerCount,
                outputMode: this.outputMode,
                waveScale: this.waveScale,
                normalIntensity: this.normalIntensity,
                heightRange: this.heightRange,
                normalizeHeights: this.normalizeHeights,
                waveLayers: this.waveLayers.slice(0, this.layerCount) // Only include active layers
            }
        };
        
        const dataStr = JSON.stringify(preset, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fourier_wave_preset_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Preset exported successfully');
    }
    
    async importPreset(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const preset = JSON.parse(text);
            
            // Validate preset structure
            if (!preset.settings) {
                throw new Error('Invalid preset format');
            }
            
            const settings = preset.settings;
            
            // Apply settings
            this.loopDuration = settings.loopDuration || 2.0;
            this.speed = settings.speed || 1.0;
            this.layerCount = settings.layerCount || 4;
            this.outputMode = settings.outputMode || 'normal';
            this.waveScale = settings.waveScale || 1.0;
            this.normalIntensity = settings.normalIntensity || 1.0;
            this.heightRange = settings.heightRange || 1.0;
            this.normalizeHeights = settings.normalizeHeights || false;
            
            // Apply wave layers
            if (settings.waveLayers) {
                this.waveLayers = [...settings.waveLayers];
                // Ensure all layers have sharpness property (backward compatibility)
                for (let layer of this.waveLayers) {
                    if (layer.sharpness === undefined) {
                        layer.sharpness = 0.0;
                    }
                    // Ensure all layers have locked states (backward compatibility)
                    if (!layer.locked) {
                        layer.locked = {
                            amplitude: false, spatialFreq: false, temporalFreq: false,
                            direction: false, phase: false, sharpness: false
                        };
                    }
                }
                // Ensure we have enough layers
                while (this.waveLayers.length < 8) {
                    this.waveLayers.push(this.generateRandomWaveLayer());
                }
            }
            
            // Update UI controls
            document.getElementById('loopDuration').value = this.loopDuration;
            document.getElementById('speed').value = this.speed;
            document.getElementById('speedValue').textContent = this.speed.toFixed(1);
            document.getElementById('layerCount').value = this.layerCount;
            document.getElementById('outputMode').value = this.outputMode;
            document.getElementById('waveScale').value = this.waveScale;
            document.getElementById('waveScaleValue').textContent = this.waveScale.toFixed(1);
            document.getElementById('normalIntensity').value = this.normalIntensity;
            document.getElementById('normalIntensityValue').textContent = this.normalIntensity.toFixed(1);
            document.getElementById('heightRange').value = this.heightRange;
            document.getElementById('heightRangeValue').textContent = this.heightRange.toFixed(1);
            document.getElementById('normalizeHeights').checked = this.normalizeHeights;
            
            // Update wave layer controls
            this.updateWaveLayerControls();
            this.updateModeUI();
            
            // Save the imported settings
            this.saveSettings();
            
            // Reset file input
            document.getElementById('importPresetFile').value = '';
            
            console.log('Preset imported successfully:', preset.name || 'Unnamed preset');
            showNotification('Preset imported successfully!');
            
        } catch (error) {
            console.error('Error importing preset:', error);
            alert('Error importing preset. Please check the file format.');
        }
    }
}

// Initialize the application
window.addEventListener('load', () => {
    try {
        new FourierWaveGenerator();
        

        
    } catch (error) {
        console.error('Failed to initialize Fourier Wave Generator:', error);
        alert('Failed to initialize WebGL. Please ensure your browser supports WebGL.');
    }
});

// Show a custom notification on the left side
function showNotification(message, duration = 2500) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
} 