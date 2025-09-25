/**
 * Lucky50 - 3D 運勢球體
 * 使用 Three.js 創建沉浸式 3D 投資運勢視覺化
 */

class FortuneSphere {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.sphere = null;
        this.particles = [];
        this.animationId = null;
        
        this.init();
    }

    /**
     * 初始化 3D 場景
     */
    init() {
        if (!this.container) {
            console.error('容器元素未找到');
            return;
        }

        // 創建場景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);

        // 創建相機
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.z = 5;

        // 創建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.container.appendChild(this.renderer.domElement);

        // 創建主球體
        this.createMainSphere();
        
        // 創建粒子系統
        this.createParticleSystem();
        
        // 創建環境光和點光源
        this.createLights();

        // 開始渲染循環
        this.animate();

        // 處理視窗大小調整
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * 創建主運勢球體
     */
    createMainSphere() {
        const geometry = new THREE.SphereGeometry(1.5, 64, 64);
        
        // 創建材質
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                fortuneScore: { value: 50 },
                color1: { value: new THREE.Color(0x667eea) },
                color2: { value: new THREE.Color(0x764ba2) },
                color3: { value: new THREE.Color(0xff6b6b) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vNormal = normal;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float fortuneScore;
                uniform vec3 color1;
                uniform vec3 color2;
                uniform vec3 color3;
                
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    // 基於運勢分數的顏色混合
                    float score = fortuneScore / 100.0;
                    vec3 baseColor = mix(color3, color1, score);
                    
                    // 添加動態波紋效果
                    float wave = sin(vPosition.y * 3.0 + time) * 0.5 + 0.5;
                    vec3 waveColor = mix(baseColor, color2, wave * 0.3);
                    
                    // 添加邊緣光暈效果
                    float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    vec3 finalColor = mix(waveColor, color1, fresnel * 0.5);
                    
                    // 添加一些閃爍效果
                    float sparkle = sin(vPosition.x * 10.0 + time * 2.0) * sin(vPosition.z * 10.0 + time * 1.5) * 0.1 + 0.9;
                    
                    gl_FragColor = vec4(finalColor * sparkle, 0.9);
                }
            `,
            transparent: true
        });

        this.sphere = new THREE.Mesh(geometry, material);
        this.sphere.castShadow = true;
        this.sphere.receiveShadow = true;
        this.scene.add(this.sphere);
    }

    /**
     * 創建粒子系統
     */
    createParticleSystem() {
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // 隨機位置（球形分佈）
            const radius = 3 + Math.random() * 2;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // 隨機顏色
            const color = new THREE.Color();
            color.setHSL(Math.random() * 0.3 + 0.5, 0.7, 0.5);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
            
            // 隨機大小
            sizes[i] = Math.random() * 3 + 1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pointTexture: { value: this.createPointTexture() }
            },
            vertexShader: `
                attribute float size;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    
                    vec3 pos = position;
                    pos.x += sin(time + position.y * 0.01) * 0.1;
                    pos.y += cos(time + position.x * 0.01) * 0.1;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                
                void main() {
                    vec4 texColor = texture2D(pointTexture, gl_PointCoord);
                    gl_FragColor = vec4(vColor, texColor.a);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true,
            vertexColors: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    /**
     * 創建點精靈紋理
     */
    createPointTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.4, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        
        return new THREE.CanvasTexture(canvas);
    }

    /**
     * 創建燈光
     */
    createLights() {
        // 環境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // 主點光源
        const pointLight1 = new THREE.PointLight(0x667eea, 1, 100);
        pointLight1.position.set(5, 5, 5);
        pointLight1.castShadow = true;
        this.scene.add(pointLight1);

        // 輔助點光源
        const pointLight2 = new THREE.PointLight(0xff6b6b, 0.8, 100);
        pointLight2.position.set(-5, -5, 3);
        this.scene.add(pointLight2);

        // 背景光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
        directionalLight.position.set(0, 1, 0);
        this.scene.add(directionalLight);
    }

    /**
     * 更新運勢球體
     */
    updateFortune(score, fortuneData) {
        if (!this.sphere) return;

        // 更新 shader 參數
        this.sphere.material.uniforms.fortuneScore.value = score;

        // 根據運勢分數調整顏色
        const colors = this.getFortuneColors(score);
        this.sphere.material.uniforms.color1.value.setHex(colors.primary);
        this.sphere.material.uniforms.color2.value.setHex(colors.secondary);
        this.sphere.material.uniforms.color3.value.setHex(colors.accent);

        // 調整旋轉速度
        this.rotationSpeed = score / 100 * 0.005 + 0.002;

        // 更新粒子顏色
        this.updateParticleColors(score);
    }

    /**
     * 根據運勢分數獲取顏色
     */
    getFortuneColors(score) {
        if (score >= 80) {
            return {
                primary: 0x10B981,   // 翠綠
                secondary: 0x34D399, // 淺綠
                accent: 0x6EE7B7     // 極淺綠
            };
        } else if (score >= 60) {
            return {
                primary: 0xF59E0B,   // 金黃
                secondary: 0xFBBF24, // 淺黃
                accent: 0xFDE68A     // 極淺黃
            };
        } else if (score >= 40) {
            return {
                primary: 0x6B7280,   // 灰色
                secondary: 0x9CA3AF, // 淺灰
                accent: 0xD1D5DB     // 極淺灰
            };
        } else {
            return {
                primary: 0xEF4444,   // 紅色
                secondary: 0xF87171, // 淺紅
                accent: 0xFCA5A5     // 極淺紅
            };
        }
    }

    /**
     * 更新粒子顏色
     */
    updateParticleColors(score) {
        if (!this.particles) return;

        const colors = this.particles.geometry.attributes.color.array;
        const baseHue = score >= 80 ? 0.3 : score >= 60 ? 0.15 : score >= 40 ? 0.6 : 0.0;

        for (let i = 0; i < colors.length; i += 3) {
            const color = new THREE.Color();
            color.setHSL(baseHue + (Math.random() - 0.5) * 0.2, 0.7, 0.5);
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }

        this.particles.geometry.attributes.color.needsUpdate = true;
    }

    /**
     * 動畫循環
     */
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        const time = Date.now() * 0.001;

        // 更新 uniform 時間
        if (this.sphere) {
            this.sphere.material.uniforms.time.value = time;
            this.sphere.rotation.y += this.rotationSpeed || 0.005;
            this.sphere.rotation.x = Math.sin(time * 0.5) * 0.1;
        }

        if (this.particles) {
            this.particles.material.uniforms.time.value = time;
            this.particles.rotation.y += 0.001;
        }

        // 攝影機輕微搖擺
        this.camera.position.x = Math.sin(time * 0.5) * 0.3;
        this.camera.position.y = Math.cos(time * 0.3) * 0.2;
        this.camera.lookAt(this.scene.position);

        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 處理視窗大小調整
     */
    handleResize() {
        if (!this.container || !this.camera || !this.renderer) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /**
     * 銷毀 3D 場景
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (this.renderer) {
            this.renderer.dispose();
        }

        if (this.container && this.renderer) {
            this.container.removeChild(this.renderer.domElement);
        }

        // 清理資源
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.sphere = null;
        this.particles = null;
    }
}

// 導出類別
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FortuneSphere;
} else {
    window.FortuneSphere = FortuneSphere;
}