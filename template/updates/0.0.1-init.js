
const Register = alaska.sled('alaska-user.Register');
const Init = alaska.sled('alaska-admin.Init');

export default async function () {
  await Init.run();

  await Register.run({
    username: '${USERNAME}',
    password: '${PASSWORD}',
    roles: ['root']
  });
}
