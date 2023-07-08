<script lang="ts">
	import { onMount } from 'svelte';
	import MainScene from './scene';
	import sparkTexture from '$lib/textures/spark1.png';
	let el: HTMLCanvasElement;
	let countTriangles: number | null = null;
	let scene: MainScene | null = null;
	let max = 400,
		min = 0;

	$: if (countTriangles && countTriangles > 0 && scene) {
		scene.setTrianglesCount(countTriangles);
	}

	onMount(() => {
		scene = new MainScene(el);
		scene.addShadersMaterials(200, sparkTexture);
	});
</script>

<svelte:head>
	<title>ma boy</title>
	<meta name="description" content="Wallpaper demo app" />
</svelte:head>

<section>
	<input
		placeholder="how many triangles u want to see boy?"
		{max}
		{min}
		bind:value={countTriangles}
		on:input={(event) => {
			// Update the inputValue when the user types a number within the given range
			if (event.currentTarget.value)
				countTriangles = Math.min(Math.max(min, +event.currentTarget.value), max);
		}}
		type="number"
	/>
	<canvas bind:this={el} />
</section>

<style>
	:root {
		--header-height: 65px;
		@media (max-width: 768px) {
			--header-height: 0px;
		}
	}
	canvas {
		width: 100vw;
		height: calc(100vh - var(--header-height));
		position: fixed;
		top: var(--header-height);
		left: 0;
	}
	input {
		position: fixed;
		top: 20vh;
		width: 50%;
		left: 10vw;
		z-index: 100;
		border-radius: 5px;
		padding: 0.5rem;
		font-size: 1rem;
		outline: none;
		border: 1px solid #ccc;
		-moz-appearance: textfield;
		/* Chrome, Safari, Edge, Opera */
		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			-webkit-appearance: none;
			margin: 0;
		}
		/* Firefox */
		&[type='number'] {
			-moz-appearance: textfield;
		}
		&[type='number']::-webkit-outer-spin-button,
		&[type='number']::-webkit-inner-spin-button {
			-webkit-appearance: none;
		}

		&[type='number'] {
			-moz-appearance: textfield;
		}
		@media (max-width: 768px) {
			top: 10vh;
			width: calc(100vw - 2rem);
			left: 50%;
			transform: translateX(-50%);
		}
	}
</style>
