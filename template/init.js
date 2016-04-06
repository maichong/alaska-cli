
process.title = '${ID}';

process.chdir(__dirname);

import alaska from 'alaska';

let options = {
  id: '${ID}',
  dir: __dirname
};

alaska.launch(options).then(() => {
  console.log('${ID} started');
}, (error) => {
  process.exit(1);
});
