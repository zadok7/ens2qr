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

  return {
    ethAddress: ethAddress || 'Address not found',
    twitterName: twitterName || 'Twitter name not found',
    telegramName: telegramName || 'Telegram name not found',
    githubName: githubName || 'GitHub name not found',
    emailAddress: emailAddress || 'Email not found',
    url: url || 'URL not found',
  };
}

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