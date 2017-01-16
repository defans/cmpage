/**
 * 
 */

+function ($) {
    
    var Message = {
        template: '<div class="alert alert-#type# alert-message-box" style="position:fixed;z-index:9999;top:0px;left:0px;right:0px;margin-bottom:0;font-size:20px;text-align:center;" role="alert">#msg#<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>',
        createDiv: function(type, msg) {
            this.close()
            return this.template.replace('#type#', type).replace('#msg#', msg)
        },
        info: function(msg) {
            $(this.createDiv('info', msg)).appendTo($('body'))
            setTimeout(this.close, 8000)
        },
        success: function(msg) {
            $(this.createDiv('success', msg)).appendTo($('body'))
            setTimeout(this.close, 8000)
        },
        warn: function(msg) {
            $(this.createDiv('warning', msg)).appendTo($('body'))
            setTimeout(this.close, 8000)
        },
        error: function(msg) {
            $(this.createDiv('danger', msg)).appendTo($('body'))
        },
        close: function() {
            $('body').find('div.alert-message-box > button.close').trigger('click')
        }
    }
    
    window.Message = Message
    
}(jQuery);