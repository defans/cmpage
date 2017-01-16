'use strict';

/**
 @module cmpage.model
 */

/**
 * docu的全局方法和变量设置，置入（Object.assign）thinkjs 的 global 中
 * @class cmpage.cmpage_global
 */


export default class extends think.base {

    enumDocuType = {
        OrderApply:1, OrderApply_name:'采购申请单', OrderApply_header:'PR',
        Order:2, Order_name:'采购订单', Order_header:'PO',
        DocuArrive:3, DocuArrive_name:'到货通知单',DocuArrive_header:'DD',
        DocuCheck:4, DocuCheck_name:'外购入库单',DocuCheck_header:'GR',
        DocuSale:5, DocuSale_name:'销售出库单',DocuSale_header:'XC',
        DocuPick:6, DocuPick_name:'领料出库单',DocuPick_header:'LC',
        DocuStock:7, DocuStock_name:'盘点单',DocuStock_header:'PD',
        DocuTransfer:8, DocuTransfer_name:'调拨单',DocuTransfer_header:'DB',
        DocuInvalid:99, DocuInvalid_name:'作废单',DocuInvalid_header:'IV'
    };
    enumOrderWay = {
        SELF:0, SELF_name:'分部自采',
        HQ:1,HQ_name:'总部采购'
    }
}
