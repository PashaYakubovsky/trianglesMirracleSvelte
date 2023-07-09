/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as THREE from 'three';
import { gsap } from 'gsap';

const vertexShader = `
	attribute float size;

	varying vec3 vColor;

	void main() {

		vColor = color;

		vec4 mvPosition = modelViewMatrix * vec4( position, 1.5 );

		gl_PointSize = size * ( 100.0 / -mvPosition.z );

		gl_Position = projectionMatrix * mvPosition;

	}
`;

const fragmentShader = `
	uniform sampler2D pointTexture;

	varying vec3 vColor;

	void main() {

		gl_FragColor = vec4( vColor, 2.0 );

		gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );

	}
`;

// get random number from range function
const getRandomBetween = (min: number, max: number) =>
	Math.floor(Math.random() * (max - min + 1) + min);

class MainScene {
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer;
	private mouse = new THREE.Vector2();
	private raycaster = new THREE.Raycaster();
	private animatedContinue = false;
	private particleSystem: THREE.Points | null = null;
	private textureLoader = new THREE.TextureLoader();
	private conesMesh: THREE.Mesh[] = [];

	constructor(el: HTMLCanvasElement) {
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);

		this.renderer = new THREE.WebGLRenderer({
			canvas: el,
			antialias: true,
			alpha: true,
			powerPreference: 'high-performance'
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

		this.camera.position.z = 50;

		this.raycaster = new THREE.Raycaster();

		window.addEventListener('resize', () => this.resize());
		window.addEventListener('mousemove', (event) => this.onMouseMove(event));

		this.addLights();

		this.animate();
	}

	public addLights() {
		const ambientLight = new THREE.AmbientLight(0x404040);
		ambientLight.intensity = 0.2;

		const directionalLight = new THREE.DirectionalLight(0xffffff);
		directionalLight.position.set(0, 1, 1).normalize();
		directionalLight.intensity = 0.2;

		const pointLight = new THREE.PointLight(0xffffff, 2, 1000);
		pointLight.position.set(0, 0, 0);
		pointLight.intensity = 0.2;
		this.scene.add(pointLight, directionalLight, ambientLight);
	}

	public addCones(textureSrc: string, numberOfCones: number) {
		if (this.conesMesh.length > 0) {
			this.conesMesh.forEach((cone) => {
				this.scene.remove(cone);
			});
			this.conesMesh = [];
		}

		const geometry = new THREE.ConeGeometry(1, 1, 3);

		const texture = this.textureLoader.load(textureSrc);

		texture.mapping = THREE.EquirectangularReflectionMapping;
		texture.colorSpace = THREE.SRGBColorSpace;

		const material = new THREE.MeshPhysicalMaterial({
			envMap: texture,
			roughness: 0.5,
			metalness: 0.5,
			reflectivity: 0.5
		});

		for (let i = 0; i < numberOfCones; i++) {
			const cone = new THREE.Mesh(geometry, material);

			cone.position.set(
				getRandomBetween(-100, 100),
				getRandomBetween(-100, 100),
				getRandomBetween(-100, 100)
			);
			this.conesMesh.push(cone);
			this.scene.add(cone);
		}

		return this.conesMesh;
	}

	public onMouseMove(event: MouseEvent) {
		this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

		// animated camera on mouse move
		const newPosition = new THREE.Vector3(
			this.mouse.x * 20,
			this.mouse.y * 20,
			Math.sin(this.mouse.x * this.mouse.y) + this.camera.position.z
		);

		const newRotation = new THREE.Vector3(
			this.mouse.y * 0.1,
			this.mouse.x * 0.1,
			Math.sin(this.mouse.x * this.mouse.y)
		);

		gsap.to(this.camera.position, {
			duration: 0.5,
			z: newPosition.z,
			y: newPosition.y,
			x: newPosition.x,
			ease: 'power0'
		});

		gsap.to(this.camera.rotation, {
			duration: 1.5,
			z: newRotation.z,
			y: newRotation.y,
			x: newRotation.x,
			ease: 'power2'
		});
	}

	public addShadersMaterials(particles: number, texture: string) {
		const shaderMaterial = new THREE.ShaderMaterial({
			uniforms: {
				pointTexture: { value: this.textureLoader.load(texture) }
			},
			vertexShader,
			fragmentShader,
			blending: THREE.AdditiveBlending,
			depthTest: false,
			transparent: true,
			vertexColors: true
		});

		const radius = 200;

		const geometry = new THREE.BufferGeometry();

		const positions = [];
		const colors = [];
		const sizes = [];

		const color = new THREE.Color();

		for (let i = 0; i < particles; i++) {
			positions.push((Math.random() * 2 - 1) * radius);
			positions.push((Math.random() * 2 - 1) * radius);
			positions.push((Math.random() * 2 - 1) * radius);

			color.setHSL(i / particles, 1.0, 0.5);

			colors.push(color.r, color.g, color.b);

			sizes.push(20);
		}

		geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
		geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
		geometry.setAttribute(
			'size',
			new THREE.Float32BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage)
		);

		this.particleSystem = new THREE.Points(geometry, shaderMaterial);

		this.scene.add(this.particleSystem);
	}

	public animate() {
		requestAnimationFrame(() => this.animate());
		this.renderer.render(this.scene, this.camera);

		if (this.particleSystem) {
			const time = Date.now() * 0.002;

			const geometry = this.particleSystem.geometry;
			const attributes = geometry.attributes;
			const newArray = [];

			for (let i = 0; i < attributes.size.array.length; i++) {
				newArray[i] = 10 * (1 + Math.sin(0.1 * i + time));
			}

			// @ts-ignore
			attributes.size.array = new Float32Array(newArray);
			attributes.size.needsUpdate = true;
		}
	}

	public resize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	public getScene() {
		return this.scene;
	}

	public getCamera() {
		return this.camera;
	}

	public getRenderer() {
		return this.renderer;
	}

	public dispose() {
		this.scene.clear();
		this.renderer.dispose();
	}
}

export default MainScene;
