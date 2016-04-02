const Register = service.sled('user.Register');
const Init = service.sled('admin.Init');

export default async function () {
  await Init.run();

  await Register.run({
    username: '${USERNAME}',
    password: '${PASSWORD}',
    roles: ['root']
  });
}
