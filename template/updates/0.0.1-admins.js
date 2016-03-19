'use strict';

const service = __service;

const User = service.model('user.User');
const Role = service.model('user.Role');

export default async function () {
  let userService = service.service('user');

  let user = new User({
    username: '${USERNAME}',
    password: '${PASSWORD}',
    roles: ['admin'],
    abilities: []
  });

  await user.save();

  let role = await Role.findCache('admin');
  if (role) {
    let abilities = await userService.abilities();
    if (!role.abilities) {
      role.abilities = [];
    }
    abilities.forEach(record => {
      if (role.abilities.indexOf(record.id) < 0) {
        role.abilities.push(record.id);
      }
    });
    await role.save();
  }
};
