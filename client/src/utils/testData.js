const testData = {
  name: 'All Cryptos',
  children: [
    { name: 'Bitcoin' },
    { name: 'Etherium' },
    { name: 'Polkadot' },
    {
      name: 'POW',
      children: [
        { name: 'Bitcoin' },
        { name: 'Litecoin' },
        { name: 'Bitcoin Cash' },
      ],
    },
    {
      name: 'Public Chains',
      children: [
        { name: 'Ripple' },
        { name: 'Chainlink' },
        {
          name: 'POW',
          children: [
            { name: 'Bitcoin' },
            { name: 'Litecoin' },
            { name: 'Bitcoin Cash' },
          ],
        },
        {
          name: 'POS',
          children: [
            { name: 'Etherium' },
            { name: 'EOS' },
            {
              name: 'Crosschain',
              children: [
                { name: 'Polkadot' },
                { name: 'Cosmos' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const explorer = {
  "name": "",
  "children": [
    {
      "name": "Most common joseki starts:",
      "children": [
        {
          "name": "Hoshi",
          "sgf": "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[pd])"
        }, {
          "name": "Hoshi approached low",
          "sgf": "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[pd];W[qf])"
        }, {
          "name": "San San invasion",
          "sgf": "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[pd];W[qc])"
        }, {
          "name": "Komoku approached high",
          "sgf": "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[qd];W[od])"
        }, {
          "name": "Komoku approached low",
          "sgf": "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[qd];W[oc])"
        }
      ]
    }, {
      "name": "Approach an already extended corner:",
      "children": [
        {
          "name": "hoshi keima shimari",
          "sgf": "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[pd];W[];B[nc])"
        }, {
          "name": "hoshi ogeima shimari",
          "sgf": "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[pd];W[];B[mc])"
        }, {
          "name": "komoku keima shimari",
          "sgf": "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[qd];W[];B[oc])"
        }, {
          "name": "komoku ogeima shimari",
          "sgf": "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[qd];W[];B[nc])"
        }, {
          "name": "komoku ikentobi shimari",
          "sgf": "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[qd];W[];B[nd])"
        }
      ]
    }
  ]
};

const testDataWithId = {
  name: 'All Cryptos',
  _id: 0,
  children: [
    { name: 'Bitcoin', _id: 1 },
    { name: 'Etherium', _id: 2 },
    { name: 'Polkadot', _id: 3 },
    {
      name: 'POW',
      _id: 4,
      children: [
        { name: 'Bitcoin', _id: 5 },
        { name: 'Litecoin', _id: 6 },
        { name: 'Bitcoin Cash', _id: 7 },
      ],
    },
    {
      name: 'Public Chains',
      _id: 8,
      children: [
        { name: 'Ripple', _id: 9 },
        { name: 'Chainlink', _id: 10 },
        {
          name: 'POW',
          _id: 11,
          children: [
            { name: 'Bitcoin', _id: 12 },
            { name: 'Litecoin', _id: 13 },
            { name: 'Bitcoin Cash', _id: 14 },
          ],
        },
        {
          name: 'POS',
          _id: 15,
          children: [
            { name: 'Etherium', _id: 16 },
            { name: 'EOS', _id: 17 },
            {
              name: 'Crosschain',
              _id: 18,
              children: [
                { name: 'Polkadot', _id: 19 },
                { name: 'Cosmos', _id: 20 },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const initializedTestData = {
  name: 'All Cryptos',
  _id: 0,
  checked: 0,
  children: [
    { name: 'Bitcoin', _id: 1, checked: 0 },
    { name: 'Etherium', _id: 2, checked: 0 },
    { name: 'Polkadot', _id: 3, checked: 0 },
    {
      name: 'POW',
      _id: 4,
      checked: 0,
      children: [
        { name: 'Bitcoin', _id: 5, checked: 0 },
        { name: 'Litecoin', _id: 6, checked: 0 },
        { name: 'Bitcoin Cash', _id: 7, checked: 0 },
      ],
    },
    {
      name: 'Public Chains',
      _id: 8,
      checked: 0,
      children: [
        { name: 'Ripple', _id: 9, checked: 0 },
        { name: 'Chainlink', _id: 10, checked: 0 },
        {
          name: 'POW',
          _id: 11,
          checked: 0,
          children: [
            { name: 'Bitcoin', _id: 12, checked: 0 },
            { name: 'Litecoin', _id: 13, checked: 0 },
            { name: 'Bitcoin Cash', _id: 14, checked: 0 },
          ],
        },
        {
          name: 'POS',
          _id: 15,
          checked: 0,
          children: [
            { name: 'Etherium', _id: 16, checked: 0 },
            { name: 'EOS', _id: 17, checked: 0 },
            {
              name: 'Crosschain',
              _id: 18,
              checked: 0,
              children: [
                { name: 'Polkadot', _id: 19, checked: 0 },
                { name: 'Cosmos', _id: 20, checked: 0 },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export {
  explorer,
  testData,
  testDataWithId,
  initializedTestData,
};
