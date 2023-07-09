<script lang="ts">
	import { onMount } from 'svelte';
	import MainScene from './scene';
	import sparkTexture from '$lib/textures/spark1.png';
	import matcapTexure from '$lib/textures/10.png';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
	import type { MeshPhysicalMaterial } from 'three';

	gsap.registerPlugin(ScrollTrigger);

	let canvasElement: HTMLCanvasElement;
	let sectionElements: HTMLElement[] = [];
	let countTriangles: number | null = 1;
	let scene: MainScene | null = null;
	let cones3d: THREE.Mesh[] = [];
	let camera: THREE.PerspectiveCamera | null = null;
	let max = 400,
		min = 0;

	$: if (countTriangles && countTriangles > 0 && scene) {
		cones3d = scene.addCones(matcapTexure, countTriangles);
	}

	// run callback when cones3d changes
	$: if (cones3d.length > 0 && sectionElements.length > 0) {
		for (const cone of cones3d) {
			gsap.to(cone.rotation, {
				duration: 0.1,
				x: Math.random() * 10,
				y: Math.random() * 10,
				z: Math.random() * 10,
				ease: 'power3.inOut',
				scrollTrigger: {
					trigger: sectionElements[0],
					start: 'top top',
					end: 'bottom bottom',
					scrub: true
				}
			});

			gsap.to(cone.scale, {
				duration: 0.1,
				x: Math.random() * 10,
				y: Math.random() * 10,
				z: Math.random() * 10,
				ease: 'power3.inOut',
				scrollTrigger: {
					trigger: sectionElements[1],
					start: 'top top',
					end: 'bottom bottom',
					scrub: true
				}
			});

			gsap.to(cone.position, {
				duration: 0.1,
				x: Math.random() * 10,
				y: Math.random() * 10,
				z: Math.random() * 10,
				ease: 'power3.inOut',
				scrollTrigger: {
					trigger: sectionElements[2],
					start: 'top top',
					end: 'bottom bottom',
					scrub: true
				}
			});
			const material = cone.material as MeshPhysicalMaterial;
			gsap.fromTo(
				material,
				{ roughness: 0, metalness: 0 },
				{
					duration: 0.1,
					roughness: 1,
					metalness: 1,
					normalScale: { x: 1, y: 1 },
					ease: 'power3.inOut',
					scrollTrigger: {
						trigger: sectionElements[3],
						start: 'top top',
						end: 'bottom bottom',
						scrub: true
					}
				}
			);
		}
	}

	onMount(() => {
		scene = new MainScene(canvasElement);
		scene.addShadersMaterials(200, sparkTexture);
		cones3d = scene.addCones(matcapTexure, 1);
		camera = scene.getCamera();

		return () => {
			if (scene) scene.dispose();
		};
	});
</script>

<svelte:head>
	<title>ma boy</title>
	<meta name="description" content="Wallpaper demo app" />
</svelte:head>

<section bind:this={sectionElements[0]}>
	<label>
		how many triangles u want to see boy?
		<input bind:value={countTriangles} type="number" {min} {max} />
		<input bind:value={countTriangles} type="range" {min} {max} />
	</label>

	<canvas bind:this={canvasElement} />
</section>

<section bind:this={sectionElements[1]} />
<section bind:this={sectionElements[2]} />
<section bind:this={sectionElements[3]} />

<style>
	:root {
		--header-height: 65px;
		@media (max-width: 768px) {
			--header-height: 0px;
		}
	}
	label {
		position: absolute;
		top: 20vh;
		width: 50%;
		left: 10vw;
		z-index: 100;
		border-radius: 5px;
		padding: 0.5rem;
		font-size: 1rem;
		outline: none;
		border: 1px solid #ccc;
		@media (max-width: 768px) {
			top: 10vh;
			width: calc(100vw - 2rem);
			left: 50%;
			transform: translateX(-50%);
		}
	}
	section {
		height: 200vh;
		overflow-y: scroll;
	}
	canvas {
		width: 100vw;
		height: calc(100vh - var(--header-height));
		position: fixed;
		top: var(--header-height);
		left: 0;
	}
</style>
