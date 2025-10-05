import request from '@/utils/request';

/**
 * 获取指定环境下功能开关的分页列表
 * @param {string} envId - 环境的 ID
 * @param {object} params - 查询参数，例如 { page: 1, pageSize: 10, keyword: 'searchName' }
 * @returns {Promise} Axios Promise
 */
export const getFeatureFlagsApi = (envId, params) => {
    if (!envId) {
        return Promise.reject(new Error('envId is required'));
    }
    return request({
        url: `/manage/environments/${envId}/features`,
        method: 'get',
        params: params,
    });
};

/**
 * 获取单个功能开关的详细信息
 * @param {string} envId - 环境的 ID
 * @param {string} ffId - 功能开关的 ID
 * @returns {Promise} Axios Promise
 */
export const getFeatureFlagDetailsApi = (envId, ffId) => {
    return request({
        url: `/manage/environments/${envId}/features/${ffId}`,
        method: 'get',
    });
};

/**
 * 创建一个新的功能开关
 * @param {string} envId - 环境的 ID
 * @param {object} data - 功能开关的数据
 * @returns {Promise} Axios Promise
 */
export const createFeatureFlagApi = (envId, data) => {
    return request({
        url: `/manage/environments/${envId}/features`,
        method: 'post',
        data: data,
    });
};

/**
 * 更新一个指定的功能开关
 * @param {string} envId - 环境的 ID
 * @param {string} ffId - 功能开关的 ID
 * @param {object} data - 需要更新的数据
 * @returns {Promise} Axios Promise
 */
export const updateFeatureFlagApi = (envId, ffId, data) => {
    return request({
        url: `/manage/environments/${envId}/features/${ffId}`,
        method: 'put',
        data: data,
    });
};

/**
 * 删除一个指定的功能开关
 * @param {string} envId - 环境的 ID
 * @param {string} ffId - 功能开关的 ID
 * @returns {Promise} Axios Promise
 */
export const deleteFeatureFlagApi = (envId, ffId) => {
    return request({
        url: `/manage/environments/${envId}/features/${ffId}`,
        method: 'delete',
    });
};
