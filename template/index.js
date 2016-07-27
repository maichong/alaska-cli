import alaska from 'alaska';

class MainService extends alaska.Service {

}

let service = new MainService({
  id: '${ID}',
  dir: __dirname
});

export default service;
