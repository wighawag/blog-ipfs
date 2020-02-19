const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const recursive = require('recursive-fs');
const basePathConverter = require('base-path-converter');

const pinataCredentials = JSON.parse(fs.readFileSync('.pinata').toString());

const pinDirectoryToIPFS = (src) => {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    //we gather the files from a local directory in this example, but a valid readStream is all that's needed for each file in the directory.
    recursive.readdirr(src, function (err, dirs, files) {
        let data = new FormData();
        files.forEach((file) => {
            //for each file stream, we need to include the correct relative file path
            const filepath = basePathConverter(src, file);
            console.log(src, file, filepath);
            data.append(`file`, fs.createReadStream(file), {
                filepath
            })
        });
    
        const metadata = JSON.stringify({
            name: '' + Math.floor(Date.now() / 1000),
            keyvalues: {
                timestamo: '' + Math.floor(Date.now() / 1000)
            }
        });
        data.append('pinataMetadata', metadata);

        const pinataOptions = JSON.stringify({
            cidVersion: 0
        });
        data.append('pinataOptions', pinataOptions);
    
        console.log({
            metadata,
            pinataOptions,
        });
        return axios.post(url,
            data,
            {
                maxContentLength: 'Infinity', //this is needed to prevent axios from erroring out with large directories
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                    'pinata_api_key': pinataCredentials.apiKey,
                    'pinata_secret_api_key': pinataCredentials.secret
                }
            }
        ).then(function (response) {
            console.log(JSON.stringify(response, null, '  '));
            //handle response here
        }).catch(function (error) {
            console.error(JSON.stringify(error.message, null, '  '));
            //handle error here
        });
    });
};

(async () => {
    await pinDirectoryToIPFS('__sapper__/export');
})()
