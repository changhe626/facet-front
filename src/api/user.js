import request from '@/utils/request';

export const getMeApi = () => {
    return request({
        url: '/manage/users/me',
        method: 'get',
    });
};

export const getUsersApi = (params) => {
    return request({
        url: '/manage/users',
        method: 'get',
        params: params,
    });
};

export const createUserApi = (data) => {
    return request({
        url: '/manage/users',
        method: 'post',
        data: data,
    });
};

export const updateUserApi = (userId, data) => {
    return request({
        url: `/manage/users/${userId}`,
        method: 'put',
        data: data,
    });
};

export const deleteUserApi = (userId) => {
    return request({
        url: `/manage/users/${userId}`,
        method: 'delete',
    });
};

export const getUserDetailsApi = (userId) => {
    return request({
        url: `/manage/users/${userId}`,
        method: 'get',
    });
};
