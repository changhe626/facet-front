import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '@/layouts/MainLayout.vue';
import Login from '../views/Login.vue';
import CreateFeatureFlag from '../views/CreateFeatureFlag.vue';
import Overview from '../views/Overview.vue';
import Environments from '../views/Environments.vue';
import Users from '../views/Users.vue';
import FeatureFlags from '../views/FeatureFlags.vue'; // 1. 导入功能开关列表组件

const routes = [
    {
        path: '/',
        component: MainLayout,
        redirect: '/overview',
        children: [
            {
                path: '/overview',
                name: 'Overview',
                component: Overview,
            },
            {
                path: '/feature-flags', // 2. 注册功能开关列表页面的路由
                name: 'FeatureFlags',
                component: FeatureFlags,
            },
            {
                path: '/feature-flags/create', // (保留) 创建页面，未来会用到
                name: 'CreateFeatureFlag',
                component: CreateFeatureFlag,
            },
            {
                path: '/environments',
                name: 'Environments',
                component: Environments,
            },
            {
                path: '/users',
                name: 'Users',
                component: Users,
            },
        ],
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;