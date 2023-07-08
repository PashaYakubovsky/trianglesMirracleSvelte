/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as THREE from 'three';
import { gsap } from 'gsap';

const vertexShader = `
	attribute float size;

	varying vec3 vColor;

	void main() {

		vColor = color;

		vec4 mvPosition = modelViewMatrix * vec4( position, 1.5 );

		gl_PointSize = size * ( 1000.0 / -mvPosition.z );

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

class MainScene {
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer;
	private triangles: THREE.Mesh[] = [];
	private mouse = new THREE.Vector2();
	private raycaster = new THREE.Raycaster();
	private animatedContinue = false;
	private particleSystem: THREE.Points | null = null;

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

		this.camera.position.z = 5;

		this.raycaster = new THREE.Raycaster();

		window.addEventListener('resize', () => this.resize());
		window.addEventListener('mousemove', (event) => this.onMouseMove(event));

		this.animate();
	}

	public onMouseMove(event: MouseEvent) {
		this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

		this.raycaster.setFromCamera(this.mouse, this.camera);

		const intersects = this.raycaster.intersectObjects(this.scene.children);

		for (let i = 0; i < intersects.length; i++) {
			const intersect = intersects[i];

			if (!this.animatedContinue) {
				this.animatedContinue = true;

				if (intersect.object instanceof THREE.Mesh) {
					gsap.to(intersect.object.scale, {
						x: Math.random() * 5,
						y: Math.random() * 5,
						z: Math.random() * 5,
						duration: 0.5,
						ease: 'power0.inOut',
						onComplete: () => {
							this.animatedContinue = false;
						}
					});
				}
			}
		}
	}

	public addShadersMaterials(particles: number, texture: string) {
		const shaderMaterial = new THREE.ShaderMaterial({
			uniforms: {
				pointTexture: { value: new THREE.TextureLoader().load(texture) }
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

	public addTriangles(count: number) {
		this.triangles = [];
		const geometry = new THREE.BufferGeometry();
		const vertices = new Float32Array(count * 3);

		for (let i = 0; i < count * 3; i++) {
			vertices[i] = Math.random() * 2 - 1;
		}

		geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

		const material = new THREE.MeshBasicMaterial({
			color: new THREE.Color('rgb(55, 2, 60)'),
			side: THREE.DoubleSide,
			wireframe: true
		});

		for (let i = 0; i < count; i++) {
			const triangle = new THREE.Mesh(geometry, material);
			triangle.position.x = Math.random() * 4;
			triangle.position.y = Math.random() * 4;
			triangle.position.z = Math.random() * 4;
			triangle.rotation.x = Math.random() * 2 * Math.PI;
			triangle.rotation.y = Math.random() * 2 * Math.PI;
			triangle.rotation.z = Math.random() * 2 * Math.PI;
			// triangle.scale.setScalar(Math.random() + 0.5);
			this.triangles.push(triangle);
			this.scene.add(triangle);
		}
	}

	public animate() {
		requestAnimationFrame(() => this.animate());
		this.renderer.render(this.scene, this.camera);

		if (this.triangles) {
			for (let i = 0; i < this.triangles.length; i++) {
				const triangle = this.triangles[i];
				triangle.rotation.x += 0.01;
				triangle.rotation.y += 0.01;
			}
		}

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

	public setTrianglesCount(count: number) {
		// clear canvas
		this.triangles.forEach((triangle) => {
			this.scene.remove(triangle);
		});

		// add new triangles
		this.addTriangles(count);
	}
}

export default MainScene;
