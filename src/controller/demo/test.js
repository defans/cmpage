'use strict';

const Base = require('../base.js');

module.exports = class extends Base {
  questionAction(){
    //auto render template file index_index.html
    return this.display();
  }

  async save_questionAction(){
      let parms = this.post();

      if(think.isEmpty(parms.c_name) || think.isEmpty(parms.c_answer)){
          return this.json({statusCode:300, message:'请选择1个以上的主题并输入姓名后递交!'});
      }

      let questionModel = this.model('t_question');
      let ret = await questionModel.where({c_name:parms.c_name}).find();
      let rec = {c_name:parms.c_name, c_answer:parms.c_answer, c_time:think.datetime(), c_status:0};
      if(think.isEmpty(ret)){
          await questionModel.add(rec);
      }else{
          await questionModel.where({c_name:parms.c_name}).update(rec);
      }
      return this.json({statusCode:200, message:'递交成功!'});
  }

  async answer_listAction(){
    let list = await this.model('t_question').select();
    let listHtml = [];
    for(let rec of list){
        let arr = rec.c_answer.split(':');
        let content = '';
        for(let s of arr){
            if(!think.isEmpty(s))       content += `<p class="mui-h6 mui-ellipsis">${arr.indexOf(s)+1}，${s}</p>`;
        }
        listHtml.push(`<li class="mui-table-view-cell">
		            <div class="mui-table">
		                <div class="mui-table-cell mui-col-xs-10">
		                    <h4 class="mui-ellipsis">${rec.c_name}</h4>
		                    ${content}
		                </div>
		                <div class="mui-table-cell mui-col-xs-2 mui-text-right">
		                    <span class="mui-h5">${cmpage.datetime(rec.c_time,'MM-DD')}</span>
		                </div>
		            </div>
		        </li>`);
    }

    this.assign('listHtml',listHtml.join(''));
    return this.display();
  }

}
