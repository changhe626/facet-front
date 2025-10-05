import request from '@/utils/request';

/**
 * 获取所有已激活的环境列表（用于下拉框）
 * @returns {Promise} Axios Promise
 */
export const getActiveEnvironmentsApi = () => {
    return request({
        url: '/manage/environments/active-list',
        method: 'get',
    });
};

/**
 * 获取环境的分页列表
 * @param {object} params - 查询参数，例如 { page: 1, pageSize: 10 }
 * @returns {Promise} Axios Promise
 */
export const getEnvironmentsApi = (params) => {
    return request({
        url: '/manage/environments',
        method: 'get',
        params: params,
    });
};

/**
 * 创建一个新环境
 * @param {object} data - 环境数据，例如 { name, description, isActive }
 * @returns {Promise} Axios Promise
 */
export const createEnvironmentApi = (data) => {
    return request({
        url: '/manage/environments',
        method: 'post',
        data: data,
    });
};

/**
 * 更新一个指定环境
 * @param {string} envId - 环境的 ID
 * @param {object} data - 需要更新的环境数据
 * @returns {Promise} Axios Promise
 */
export const updateEnvironmentApi = (envId, data) => {
    return request({
        url: `/manage/environments/${envId}`,
        method: 'put',
        data: data,
    });
};

/**
 * 删除一个指定环境
 * @param {string} envId - 环境的 ID
 * @returns {Promise} Axios Promise
 */
export const deleteEnvironmentApi = (envId) => {
    return request({
        url: `/manage/environments/${envId}`,
        method: 'delete',
    });
};
