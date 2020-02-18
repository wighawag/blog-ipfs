<script>
	import Nav from '../components/Nav.svelte';
	import MailingList from "../components/MailingList";

	import wallet from '../stores/wallet';

	export let segment;

	let modalText;

	let ensName = 'wighawag.eth';
	let fallbackAddress;

	async function donate(value) {
		if ($wallet.status === 'NoWallet') {
			modalText = `You need a web3 wallet to donate. Alternative send tokens or ethers to ${ensName} ${fallbackAddress ? `{${fallbackAddress})` : ''}`;
		} else if ($wallet.status === 'Loading') {
			modalText = 'Please wait while we load your wallet...';
			// TODO await // loading ?
		} else if ($wallet.status === 'Error') {
			modalText = 'An error occured : ' + ($wallet.error.message ? $wallet.error.message : $wallet.error);
		} else if ($wallet.status === 'Opera_Locked') {
			modalText = 'You are using Opera, please setup your wallet. And retry';
		} else if ($wallet.status === 'Opera_FailedChainId') {
			modalText = 'You are using Opera, please setup your wallet. And retry';
		} else if ($wallet.status === 'WalletToChoose') {
			// TODO
			modalText = `We encountered an issue, send tokens or ethers to ${ensName} ${fallbackAddress ? `{${fallbackAddress})` : ''}`;
		} else if ($wallet.status === 'SettingUpWallet') {
			modalText = 'Please wait while we load your wallet...';
		} else if ($wallet.chainNotSupported) {
			modalText = 'Please switch to the mainnet';
		} else {
			return wallet.tx({to: ensName, value});
		}
	}
</script>

<style>
	main {
		position: relative;
		max-width: 56em;
		background-color: white;
		padding: 2em;
		margin: 0 auto;
		box-sizing: border-box;
	}

	/* The Modal (background) */
	.modal {
	  display: none; /* Hidden by default */
	  position: fixed; /* Stay in place */
	  z-index: 1; /* Sit on top */
	  left: 0;
	  top: 0;
	  width: 100%; /* Full width */
	  height: 100%; /* Full height */
	  overflow: auto; /* Enable scroll if needed */
	  background-color: rgb(0,0,0); /* Fallback color */
	  background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
	}
	
	/* Modal Content/Box */
	.modal-content {
	  text-align:center;
	  background-color: #fefefe;
	  margin: 15% auto; /* 15% from the top and centered */
	  padding: 20px;
	  border: 1px solid #888;
	  width: 80%; /* Could be more or less, depending on screen size */
	}
	
	/* The Close Button */
	.close {
	  color: #aaa;
	  float: right;
	  font-size: 28px;
	  font-weight: bold;
	}
	
	.close:hover,
	.close:focus {
	  color: black;
	  text-decoration: none;
	  cursor: pointer;
	}
</style>

<div id="myModal" class="modal" style="display:{modalText ? 'block' : 'none'}">
	<!-- Modal content -->
	
	<div class="modal-content">
		<span class="close" on:click="{() => modalText = null}">&times;</span>
	<p>{modalText}</p>
	</div>
</div>


<Nav {segment}/>

<main>
	<slot></slot>

	<MailingList />

	<p style="text-align:center;"><button on:click="{() => donate('10000000000000000')}">Donate 0.01 ETH</button></p>
</main>