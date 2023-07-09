<script lang="ts">
	import { onMount } from 'svelte';
	import MainScene from './scene';
	import sparkTexture from '$lib/textures/spark1.png';
	import matcapTexure from '$lib/textures/10.png';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
	import { ScrollToPlugin } from 'gsap/dist/ScrollToPlugin';
	import type { MeshPhysicalMaterial } from 'three';

	gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

	let lights: THREE.Light[] = [];
	let canvasElement: HTMLCanvasElement;
	let sectionElements: HTMLElement[] = [];
	let countTriangles: number | null = 200;
	let scene: MainScene | null = null;
	let cones3d: THREE.Mesh[] = [];
	let max = 1000,
		min = 0;

	$: if (countTriangles && countTriangles > 0 && scene) {
		if (countTriangles > max) countTriangles = max;
		cones3d = scene.addCones(matcapTexure, countTriangles);
	}

	$: if (cones3d.length > 0 && sectionElements.length > 0) {
		for (const cone of cones3d) {
			gsap.to(lights, {
				duration: 2,
				intensity: 1,
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

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: sectionElements[2],
					start: 'top top',
					end: 'bottom bottom',
					scrub: true
				}
			});

			tl.to(
				cone.rotation,
				{
					x: 0,
					y: 0,
					z: 0,
					duration: 1,
					ease: 'power3.inOut'
				},
				'='
			);

			tl.to(
				cone.position,
				{
					duration: 1,
					x: 0,
					y: 0,
					z: 0,
					ease: 'power3.inOut'
				},
				'='
			);

			tl.to(
				cone.scale,
				{
					duration: 0.1,
					x: 10,
					y: 10,
					z: 10,
					ease: 'power3.inOut'
				},
				'='
			);

			const material = cone.material as MeshPhysicalMaterial;

			tl.fromTo(
				material,
				{ roughness: 1, metalness: 0 },
				{
					duration: 1,
					roughness: 0,
					metalness: 1,

					ease: 'power3.inOut'
				},
				'>10%'
			);

			tl.to(
				material,
				{
					duration: 1,
					roughness: 1,
					metalness: 0,
					normalScale: { x: 0, y: 0 },
					ease: 'power3.inOut'
				},
				'>90%'
			);

			gsap.to(cone.scale, {
				duration: 1,
				x: 50,
				y: 50,
				z: 10,
				ease: 'power3.inOut',
				scrollTrigger: {
					trigger: sectionElements[3],
					start: 'top top',
					end: 'bottom bottom',
					scrub: true
				}
			});
		}
	}

	onMount(() => {
		scene = new MainScene(canvasElement);
		scene.addShadersMaterials(200, sparkTexture);
		cones3d = scene.addCones(matcapTexure, 1);
		lights = scene.getLights();

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
	<button
		on:click={() => {
			// scroll to end of page
			gsap.to(window, {
				duration: 8,
				scrollTo: {
					y: document.body.scrollHeight,
					autoKill: false
				},
				ease: 'power0'
			});
		}}
	>
		scroll
	</button>

	<label>
		how many triangles u want to see boy?
		<input
			bind:value={countTriangles}
			type="number"
			on:input|preventDefault={(e) => {
				if (+e.currentTarget.value < min) countTriangles = min;
				if (+e.currentTarget.value > max) countTriangles = max;
			}}
			{min}
			{max}
		/>
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
	button {
		position: absolute;
		top: 10vh;
		right: 10vw;
		z-index: 100;
		border-radius: 5px;
		padding: 0.5rem;
		font-size: 1rem;
		outline: none;
		@media (max-width: 768px) {
			top: 5vh;
			right: 5vw;
		}
	}
	label {
		position: absolute;
		top: 20vh;
		width: fit-content;
		left: 10vw;
		z-index: 100;
		border-radius: 5px;
		padding: 0.5rem;
		font-size: 1rem;
		outline: none;
		display: flex;
		flex-direction: column;
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
	input[type='number'] {
		width: fit-content;
	}
</style>
