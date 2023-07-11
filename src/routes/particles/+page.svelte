<script lang="ts">
	import { onMount } from 'svelte';
	import ParticleScene from './scene';
	import { gsap } from 'gsap';

	let canvasElement: HTMLCanvasElement;

	onMount(() => {
		const scene = new ParticleScene(canvasElement);
		scene.addObjects();

		return () => {
			scene.removeGUI();
		};
	});
</script>

<canvas bind:this={canvasElement} />

<style>
	canvas {
		position: absolute;
		width: 100%;
		height: 100%;
		left: 0;
		top: 0;
	}
</style>
