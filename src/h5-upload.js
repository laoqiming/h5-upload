/**
 * Html5文件上传jQuery插件
 * 
 * 文件上传服务器返回JSON格式为
 * 成功返回：{success:true,message:'',url:'/uploadfiles/image/123456.jpg'}
 * 错误返回：{success:false,message:'路径没有写权限',url:''}
 * 
 * @author laoqiming <laoqiming@qq.com>
 * 
 * @date 2017-4-14
 * 
 * @example
 * $('.h5-upload').h5upload();
 * 
 * @example
 * $('.h5-upload').h5upload({max:9,maxWidth:1000,maxHeight:1000});
 * 
 */
$.fn.extend({
    h5upload: function (options) {
        var settings = {
            server: '/Upload/UploadImage',
            btnAdd: 'images/image-add.png',
            btnRemove:'images/remove.png',
            max: 1,
            maxWidth: 800,
            maxHeight: 800,
            uploadFieldName: 'imageUrl',
            formFieldName:'image',
            data:[]
        };
        $.extend(settings, options);
        return $(this).each(function () {
            var container = $(this);
            $(settings.data).each(function(){
                $('<div class="h5-upload-item">\
                        <input type="file" class="h5-upload-control">\
                        <img src="'+ this +'" class="h5-upload-preview">\
                        <input type="hidden" name="' + settings.formFieldName + '" class="h5-upload-field" value="'+ this +'">\
                        <span class="h5-upload-remove"><img src="'+settings.btnRemove+'"></span>\
                        <div class="h5-upload-error"></div>\
                        <div class="h5-upload-progressbar">\
                            <span></span>\
                        </div>\
                    </div>').appendTo(container);
            });    
            container.on('change', '[type=file]', function () {
                var uploadControl = this,
                    item = $(uploadControl).closest('.h5-upload-item'),
                    field = item.find('.h5-upload-field'),
                    imgPreview = item.find('.h5-upload-preview'),
                    progressbar = item.find('.h5-upload-progressbar'),
                    btnRemove = item.find('.h5-upload-remove'),
                    errorTxt = item.find('.h5-upload-error');
                errorTxt.hide();
                progressbar.hide();
                if (uploadControl && uploadControl.files && uploadControl.files[0]) {
                    var file = uploadControl.files[0];
                    var resizeFile = file;
                    resizeImage(file, function (data) {
                        resizeFile = data;
                        var windowURL = window.URL || window.webkitURL;
                        imgPreview.prop('src', windowURL.createObjectURL(resizeFile));
                        btnRemove.show();
                        if (item.hasClass('h5-upload-item-add')) {
                            item.removeClass('h5-upload-item-add');
                        }
                        setUploadButtonAdd(container);
                        setProgressbar(progressbar,0);
                        errorTxt.hide();
                        uploadFile(resizeFile, {
                            progress: function (e) {
                                if (e.lengthComputable) {
                                    setProgressbar(progressbar, Math.round(e.loaded / e.total * 100));
                                }
                            },
                            load: function (e) {
                                if (e.target.status == 200) {
                                    try{
                                        var ret = JSON.parse(e.target.responseText);
                                        if(ret.success){
                                            if (field.length == 0) {
												field = $('<input type="hidden" name="' + settings.formFieldName + '" class="h5-upload-field" value="">').appendTo(item);
                                            }
											field.val(ret.url);
                                        }else{
                                            errorTxt.show().text(ret.message);
                                            progressbar.hide();
                                        }
                                    }catch(ex){
                                        errorTxt.show().text("上传失败！");
                                        progressbar.hide();
                                    }
                                   
                                } else {
                                    errorTxt.show().text("上传失败！");
                                    progressbar.hide();
                                }

                            },
                            fail: function (e) {
                                errorTxt.show().text("上传失败！");
                                progressbar.hide();
                            }, cancel: function () {
                                errorTxt.show().text("上传被取消！");
                                progressbar.hide();
                            }
                        });
                    });
                }
            });
            container.on('click', '.h5-upload-remove', function () {
                $(this).closest('.h5-upload-item').remove();
                setUploadButtonAdd(container);
            });
            $('.h5-upload-item',container).each(function(){
                $('.h5-upload-remove',this).show();
                setItemSize($(this));
            });
            setUploadButtonAdd(container);
        });
        function setItemSize(item){
            item.height(item.width());
            $(':file', item).width(item.width()).height(item.height());
        }
        function setRemoveButton(container){
            if($('.h5-upload-remove',container).length==1){
                $('.h5-upload-remove',container).hide();
            }
        }
        function setUploadButtonAdd(container) {
            if ($('.h5-upload-item', container).length < settings.max) {
                if ($('.h5-upload-item-add', container).length == 0) {
                    var item = $('<div class="h5-upload-item-add h5-upload-item">\
                            <input type="file" class="h5-upload-control">\
                            <img src="'+settings.btnAdd+'" class="h5-upload-preview">\
                            <span class="h5-upload-remove"><img src="'+settings.btnRemove+'"></span>\
                            <div class="h5-upload-error"></div>\
                            <div class="h5-upload-progressbar">\
                                <span></span>\
                            </div>\
                        </div>').appendTo(container);
                    setTimeout(function () {
                        setItemSize(item);
                    }, 100);
                }
            } else {
                $('.h5-upload-item-add',container).remove();
            }
            setRemoveButton(container);
        }
        function setProgressbar(container, progress, speed) {
            if (progress) progress = Math.min(Math.max(progress, 0), 100);
            var span = container.get(0).querySelector('span');
            if (span) {
                container.show();
                var style = span.style;
                style.webkitTransform = 'translate3d(' + (-100 + progress) + '%,0,0)';
                if (typeof speed !== 'undefined') {
                    style.webkitTransitionDuration = speed + 'ms';
                } else {
                    style.webkitTransitionDuration = '';
                }
            }
            return container;
        }
        function resizeImage(file, onload) {
            var fr = new FileReader();
            fr.readAsDataURL(file);
            fr.onload = function (ev) {
                var image = new Image();
                image.src = ev.target.result;
                image.onload = function () {
                    var scale = 1;
                    if (this.width > settings.maxWidth) {
                        scale = settings.maxWidth / this.width;
                    }
                    if (this.height > settings.maxHeight) {
                        scale = settings.maxHeight / this.height;
                    }
                    if (scale == 1) {
                        onload && onload(file);
                    } else {
                        var cv = document.createElement("canvas");
                        cv.width = this.width * scale;
                        cv.height = this.height * scale;
                        cv.getContext("2d").drawImage(image, 0, 0, this.width, this.height, 0, 0, cv.width, cv.height);
                        var data = cv.toDataURL("image/jpeg", 0.8);
                        var text = window.atob(data.split(",")[1]);
                        var buffer = new ArrayBuffer(text.length);
                        var ubuffer = new Uint8Array(buffer);

                        for (var i = 0; i < text.length; i++) {
                            ubuffer[i] = text.charCodeAt(i);
                        }

                        var Builder = window.WebKitBlobBuilder || window.MozBlobBuilder;
                        var blob, type = "image/jpeg";

                        if (Builder) {
                            var builder = new Builder();
                            builder.append(buffer);
                            blob = builder.getBlob(type);
                        } else {
                            blob = new window.Blob([buffer], { type: type });
                        }
                        onload && onload(blob);
                    }
                };
            };
        }
        function uploadFile( file, setting) {
            var fd = new FormData();
            fd.append(settings.uploadFieldName, file);
            var xhr = new XMLHttpRequest();
            xhr.upload.addEventListener("progress", setting.progress, false);
            xhr.addEventListener("load", setting.load, false);
            xhr.addEventListener("error", setting.fail, false);
            xhr.addEventListener("abort", setting.cancel, false);
            xhr.open("POST",settings.server );
            xhr.send(fd);
        }
    }
});