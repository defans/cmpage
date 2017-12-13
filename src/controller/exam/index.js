'use strict';

const Base = require('./base.js');

module.exports = class extends Base {

    //登录页面
    async loginAction() {
        await this.session('index_name', 'exam');
        return this.redirect('/admin/index/login');
    }

    //主页面
    async indexAction() {
        let user = await this.session('user');
        if (think.isEmpty(user)) {
            await this.session('index_name', 'exam');
            return this.redirect('/admin/index/login');
        }
        return this.redirect('/exam/index/exam_list');
        //return this.display();
    }

    //退出登录
    async exit_loginAction() {
        await this.session('exam', 'yes');
        return this.redirect('/admin/index/exit_login');
    }

    //列出我的试卷
    async exam_listAction() {
        let user = await this.session('user');
        let listHtml = await cmpage.service('exam/exam_myexam').hhGetList(user);
        this.assign('listHtml', listHtml);
        return this.display();
    }

    //展示试卷详细信息，根据试卷状态
    async exam_student_showAction() {
        let ret = await cmpage.service('exam/exam_student').hhGetExamQuestionList(this.get('id'));
        this.assign('examStudent', ret.data);
        return this.display();
    }

    async exam_saveAction() {
        let parms = this.post();
        debug(parms, 'examSaveAction - post');
        let ret = await cmpage.service('exam/exam_student').hhExamSave(parms);
        if (ret.statusCode == 200) this.redirect('/exam/index/exam_list');
        return this.json(ret);
    }
}