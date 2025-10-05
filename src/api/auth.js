import request from '@/utils/request';

/**
 * 调用真实的登录 API
 * @param {object} data 包含 email 和 password
 * @returns {Promise} Axios Promise
 */
export const loginApi = (data) => {
    return request({
        url: '/manage/auth/login', // API 文档中定义的路径
        method: 'post',
        data: data, // 请求体
    });
};