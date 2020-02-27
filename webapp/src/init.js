import { getParamsFromURLHash, getParamsFromURL } from './utils/web';
if (process.browser) {
    // make hash link works
    const hash = document.location.hash;
    const hashElem = document.getElementById(hash.substr(1));
    if (hashElem) {
        document.location.hash = '#';
        document.location.hash = hash;
    }

    window.params = getParamsFromURL(location.href);
    // console.log('window.params', window.params);
    // console.log('location.href', location.href);
    // console.log('location.hash', location.hash);
    // console.log('location.search', location.search);
    window.hashParams = getParamsFromURLHash(location.hash);
    // console.log('window.hashParams', window.hashParams);
}
