
import Register from 'alaska-user/sleds/Register';
import Init from 'alaska-admin/sleds/Init';

export default async function () {
  await Init.run();

  await Register.run({
    username: '${USERNAME}',
    password: '${PASSWORD}',
    roles: ['root']
  });
}
