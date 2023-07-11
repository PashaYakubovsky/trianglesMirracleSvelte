/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'lil-gui';

const vertexShader = `
    uniform float time;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying float vColorRandom;
    float PI = 3.141592653589793238;

	attribute float aRandom;
	attribute float aColorRandom;

    void main() {
        vUv = uv;
		vColorRandom = aColorRandom;
        vec4 mvPosition = modelViewMatrix * vec4 ( position, 1. );
        gl_PointSize = (50.*aRandom) * ( 1. / - mvPosition.z );
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fragmentShader = `
    varying vec2 vUv;
	uniform vec3 uColor1;
	uniform vec3 uColor2;
	uniform vec3 uColor3;
	varying float vColorRandom;
	varying vec3 vPosition;


    void main() {
		float alpha = 1. - smoothstep(-0.3, 0.5, length(gl_PointCoord - vec2(0.5)));

		vec3 finalColor = uColor1;

		if (vColorRandom > 0.33 && vColorRandom < 0.66) {
			finalColor = uColor2;
		}

		if (vColorRandom > 0.66) {
			finalColor = uColor3;
		}
		

		gl_FragColor = vec4(finalColor,alpha);
    }
`;

class ParticleScene {
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer;
	private lights: THREE.Light[] = [];
	private loader = new GLTFLoader();
	private dracoLoader = new DRACOLoader();
	private textureLoader = new THREE.TextureLoader();
	private material: THREE.ShaderMaterial | null = null;
	private geometry: THREE.BufferGeometry | null = null;
	private number = 0;
	private particles: THREE.Points | null = null;
	private GUI = new GUI();

	constructor(el: HTMLCanvasElement) {
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		this.camera.rotation.x = 23.79;

		this.renderer = new THREE.WebGLRenderer({
			canvas: el,
			alpha: true,
			powerPreference: 'high-performance'
		});

		this.renderer.setClearColor(0x111111, 1);

		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

		window.addEventListener('resize', () => this.resize());

		this.addLights();

		// this.addOrbitControls();

		this.animate();
	}

	public addDebug() {
		// add debug values

		if (this.material) {
			this.GUI.add(this.material?.uniforms.uColor1.value, 'r', 0, 1, 0.01);
			this.GUI.add(this.material?.uniforms.uColor1.value, 'g', 0, 1, 0.01);
			this.GUI.add(this.material?.uniforms.uColor1.value, 'b', 0, 1, 0.01);

			this.GUI.add(this.material?.uniforms.uColor2.value, 'r', 0, 1, 0.01);
			this.GUI.add(this.material?.uniforms.uColor2.value, 'g', 0, 1, 0.01);
			this.GUI.add(this.material?.uniforms.uColor2.value, 'b', 0, 1, 0.01);

			this.GUI.add(this.material?.uniforms.uColor3.value, 'r', 0, 1, 0.01);
			this.GUI.add(this.material?.uniforms.uColor3.value, 'g', 0, 1, 0.01);
			this.GUI.add(this.material?.uniforms.uColor3.value, 'b', 0, 1, 0.01);

			this.GUI.add(this.material, 'opacity', 0, 1, 0.01);

			this.GUI.add(this.material, 'transparent');

			this.GUI.add(this.material, 'blending', {
				NoBlending: THREE.NoBlending,
				NormalBlending: THREE.NormalBlending,
				AdditiveBlending: THREE.AdditiveBlending,
				SubtractiveBlending: THREE.SubtractiveBlending,
				MultiplyBlending: THREE.MultiplyBlending,
				CustomBlending: THREE.CustomBlending
			});

			this.GUI.add(this.material, 'depthTest');
			this.GUI.add(this.material, 'depthWrite');
		}

		if (this.camera) {
			const folder = this.GUI.addFolder('Camera');
			folder.add(this.camera.position, 'z', 0, 100, 0.01);
			folder.add(this.camera.position, 'x', 0, 100, 0.01);
			folder.add(this.camera.position, 'y', 0, 100, 0.01);

			folder.add(this.camera.rotation, 'x', 0, 100, 0.01);
			folder.add(this.camera.rotation, 'y', 0, 100, 0.01);
			folder.add(this.camera.rotation, 'z', 0, 100, 0.01);
		}
	}

	public addObjects() {
		this.material = new THREE.ShaderMaterial({
			extensions: {
				// @ts-ignore
				derivatives: '#extension GL_OES_standard_derivatives : enable'
			},
			uniforms: {
				time: { value: 0 },
				resolution: { value: new THREE.Vector4() },
				uColor1: { value: new THREE.Color(0x612574) },
				uColor2: { value: new THREE.Color(0x293583) },
				uColor3: { value: new THREE.Color(0x1954ec) }
			},
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 0.5,
			vertexShader,
			fragmentShader,
			depthTest: false,
			depthWrite: false,
			blending: THREE.AdditiveBlending
		});

		this.dracoLoader = new DRACOLoader();
		this.dracoLoader.setDecoderConfig({ type: 'js' });
		this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
		this.loader.setDRACOLoader(this.dracoLoader);

		this.loader.load('/dna-02.glb', (gltf) => {
			const mesh = gltf.scene.children[0] as THREE.Mesh;
			this.geometry = mesh.geometry;
			this.geometry.center();

			this.number = this.geometry?.attributes.position.array.length as number;
			const randoms = new Float32Array(this.number / 3);
			const colorRandom = new Float32Array(this.number / 3);

			for (let i = 0; i < this.number / 3; i++) {
				randoms.set([Math.random()], i);
				colorRandom.set([Math.random()], i);
			}

			this.geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
			this.geometry.setAttribute('aColorRandom', new THREE.BufferAttribute(colorRandom, 1));

			if (this.material) {
				this.particles = new THREE.Points(this.geometry, this.material);

				this.scene.add(this.particles);

				this.addDebug();

				gsap.to(this.particles.position, {
					duration: 20,
					repeat: -1,
					y: -10,
					ease: 'power0'
				});
				gsap.to(this.particles.rotation, {
					duration: 20,
					y: Math.PI * 2,
					repeat: -1,
					ease: 'power0.easeInOut'
				});
			}
		});
	}

	public addOrbitControls() {
		const controls = new OrbitControls(this.camera, this.renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;
		controls.screenSpacePanning = false;
		controls.minDistance = 0;
		controls.maxDistance = 500;
		controls.maxPolarAngle = Math.PI / 2;
	}

	public addLights() {
		const ambientLight = new THREE.AmbientLight(0x404040);
		ambientLight.intensity = 0.2;

		const pointLight = new THREE.PointLight(0xffffff, 2, 1000);
		pointLight.position.set(0, 0, 0);
		pointLight.intensity = 0.2;
		this.scene.add(pointLight, ambientLight);
		this.lights.push(pointLight, ambientLight);
	}

	public animate() {
		requestAnimationFrame(() => this.animate());
		this.renderer.render(this.scene, this.camera);
		if (this.particles) this.particles.rotation.y += 0.001;
	}

	public resize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	public getScene() {
		return this.scene;
	}

	public removeGUI() {
		this.GUI.destroy();
	}

	public getCamera() {
		return this.camera;
	}

	public getRenderer() {
		return this.renderer;
	}

	public getLights() {
		return this.lights;
	}

	public dispose() {
		this.scene.clear();
		this.renderer.dispose();
	}
}

export default ParticleScene;
