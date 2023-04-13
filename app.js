const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const form = document.getElementById('ens-form');
const ensNameInput = document.getElementById('ens-name');
const resultsOutput = document.getElementById('results');
const resolveButton = document.getElementById('resolve');


const ENS_RESOLVER_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "node",
        "type": "bytes32"
      }
    ],
    "name": "addr",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "node",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "key",
        "type": "string"
      }
    ],
    "name": "text",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const ENS_REGISTRY_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "node",
        "type": "bytes32"
      }
    ],
    "name": "resolver",
    "outputs": [
      {
        "internalType": "contract IENSResolver",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];


async function getRecord(ensName, key) {
  try {
    const provider = new ethers.providers.getDefaultProvider('mainnet');
    const ensRegistryContract = new ethers.Contract(ENS_REGISTRY_ADDRESS, ENS_REGISTRY_ABI, provider);
    const namehash = ethers.utils.namehash(ensName);
    const resolverAddress = await ensRegistryContract.resolver(namehash);
    const ensResolverContract = new ethers.Contract(resolverAddress, ENS_RESOLVER_ABI, provider);
    return await ensResolverContract.text(namehash, key);
  } catch (error) {
    console.error(`Error fetching ${key} record:`, error);
    return '';
  }
}

async function getAddress(ensName) {
  try {
    const provider = new ethers.providers.getDefaultProvider('mainnet');
    const ensRegistryContract = new ethers.Contract(ENS_REGISTRY_ADDRESS, ENS_REGISTRY_ABI, provider);
    const namehash = ethers.utils.namehash(ensName);
    const resolverAddress = await ensRegistryContract.resolver(namehash);
    const ensResolverContract = new ethers.Contract(resolverAddress, ENS_RESOLVER_ABI, provider);
    const ethAddress = await ensResolverContract.addr(namehash);
    return ethAddress;
  } catch (error) {
    console.error('Error fetching address:', error);
    return '';
  }
}

async function getTwitter(ensName) {
  return getRecord(ensName, 'com.twitter');
}

async function getTelegram(ensName) {
  return getRecord(ensName, 'org.telegram');
}

async function getGithub(ensName) {
  return getRecord(ensName, 'com.github');
}

async function getEmail(ensName) {
  return getRecord(ensName, 'email');
}

async function getURL(ensName) {
  return getRecord(ensName, 'url');
}


async function resolveRecords(ensName) {
  const [ethAddress, twitterName, telegramName, githubName, emailAddress, url] = await Promise.all([
    getAddress(ensName),
    getTwitter(ensName),
    getTelegram(ensName),
    getGithub(ensName),
    getEmail(ensName),
    getURL(ensName),
  ]);

  if (
    (ethAddress === '0x0000000000000000000000000000000000000000' || !ethAddress) &&
    !twitterName &&
    !telegramName &&
    !githubName &&
    !emailAddress &&
    !url
  ) {
    alert('No ENS name found');
    return;
  }
  const dWebLink = ensName.endsWith('.eth') ? `https://${ensName}.limo` : undefined;

  return {
    ensName: ensName || 'ENS Name not found',
    dWebLink,
    ethAddress: ethAddress === '0x0000000000000000000000000000000000000000' ? 'Address not found' : ethAddress,
    twitterName: twitterName || 'Twitter name not found',
    telegramName: telegramName || 'Telegram name not found',
    githubName: githubName || 'GitHub name not found',
    emailAddress: emailAddress || 'Email not found',
    url: url || 'URL not found',
  };
}



/*
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const ensName = ensNameInput.value;
  const results = await resolveRecords(ensName);
  const output = {
    ensName,
    ...results,
  };
  resultsOutput.textContent = JSON.stringify(output, null, 2);
});
*/

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const ensName = ensNameInput.value;
  setNavigationVisibility(false);
  document.getElementById('qr-codes').style.display = 'none';
  setLoading(true);
  const results = await resolveRecords(ensName);
  setLoading(false);

  if (!results) {
    return;
  }

  const output = {
    ensName,
    ...results,
  };
  generateQRCodeForEachKeyValuePair(output);
  document.getElementById('qr-codes').style.display = 'block';
});



let qrIndex = 0;
const qrDataArray = [];

function generateQRCodeForEachKeyValuePair(data) {
  qrDataArray.length = 0; // Clear the array
  for (const key in data) {
    let value = data[key];
    if (value.includes('not found')) continue; // Skip if value is not found
    if (key === 'ethAddress' && value === '0x0000000000000000000000000000000000000000') continue; // Skip if ETH address is all zeros

    if (key === 'twitterName') value = 'https://twitter.com/' + value;
    if (key === 'telegramName') value = 'https://t.me/' + value;
    if (key === 'githubName') value = 'https://github.com/' + value;
    if (key === 'emailAddress') value = 'mailto:' + value;
    qrDataArray.push({ key, value });

    setNavigationVisibility(qrDataArray.length > 0);
  }

  qrIndex = 0;
  updateQRCode();
}


function updateQRCode() {
  const container = document.getElementById('qr-codes');
  container.innerHTML = ''; // Clear the container

  const { key, value } = qrDataArray[qrIndex];

  const friendlyKeyNames = {
    ensName: 'ENS Name',
    ethAddress: 'Ethereum Address',
    twitterName: 'Twitter',
    telegramName: 'Telegram',
    githubName: 'Github',
    emailAddress: 'Email',
    url: 'URL',
  };

  const wrapper = document.createElement('div');
  wrapper.style.textAlign = 'center';

  const title = document.createElement('h3');
  title.textContent = friendlyKeyNames[key] || key;
  wrapper.appendChild(title);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  wrapper.appendChild(canvas);
  container.appendChild(wrapper);

  QRCode.toCanvas(canvas, value, {
    width: canvas.width,
    height: canvas.height,
    errorCorrectionLevel: 'H', // Set error correction level to 'H'
    margin: 1, // Set margin to 1 module
    quietZone: 2, // Set quiet zone to 2 modules
  }, (error) => {
    if (error) {
      console.error(error);
    }
  });

  const valueText = document.createElement('p');
  valueText.classList.add('value');
  valueText.innerHTML = 'QR scan value: <span class="non-bold">' + value + '</span>';
  wrapper.appendChild(valueText);

  updateNavigationButtons();
}

function updateNavigationButtons() {
  document.getElementById('prev').disabled = qrIndex === 0;
  document.getElementById('next').disabled = qrIndex === qrDataArray.length - 1;
}

function setLoading(isLoading) {
  const loading = document.getElementById('loading');
  if (isLoading) {
    loading.style.display = 'block';
  } else {
    loading.style.display = 'none';
  }
}

function setNavigationVisibility(isVisible) {
  const navigation = document.getElementById('navigation');
  if (isVisible) {
    navigation.style.display = 'block';
  } else {
    navigation.style.display = 'none';
  }
}


document.getElementById('prev').addEventListener('click', () => {
  qrIndex--;
  updateQRCode();
});

document.getElementById('next').addEventListener('click', () => {
  qrIndex++;
  updateQRCode();
});
