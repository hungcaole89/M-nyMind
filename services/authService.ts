
import { User } from "../types";

const USERS_KEY = 'money_mind_users';
const CURRENT_USER_KEY = 'money_mind_current_user';

export const login = (username: string, password: string): User | null => {
  const usersStr = localStorage.getItem(USERS_KEY);
  const users = usersStr ? JSON.parse(usersStr) : [];
  
  const user = users.find((u: any) => u.username === username && u.password === password);
  
  if (user) {
    const userInfo = { username: user.username, name: user.name || user.username };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userInfo));
    return userInfo;
  }
  return null;
};

export const register = (username: string, password: string, name: string): User | null => {
  const usersStr = localStorage.getItem(USERS_KEY);
  const users = usersStr ? JSON.parse(usersStr) : [];

  if (users.find((u: any) => u.username === username)) {
    return null; // User already exists
  }

  const newUser = { username, password, name };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  const userInfo = { username, name };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userInfo));
  return userInfo;
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(CURRENT_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};
