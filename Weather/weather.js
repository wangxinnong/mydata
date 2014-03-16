String.prototype.getString = function (from, to) {
    var index1 = this.indexOf(from);
    if (index1 < 0) {
        return '';
    }
    index1 += + from.length;
    if (to) {
        var index2 = this.indexOf(to, index1);
        if (index2 < 0) {
            return '';
        }
        return this.substr(index1, index2 - index1) .trim() .replace('&nbsp;', ' ');
    } else {
        return this.substr(index1) .replace('&nbsp;', ' ');
    }
}
String.prototype.removeComment = function () {
    var ret = '';
    var index = 0;
    while (true) {
        var index1 = this.indexOf('<!--', index);
        if (index1 < 0) {
            break;
        }
        ret += this.substr(index, index1 - index);
        var index2 = this.indexOf('-->', index1 + 1);
        if (index2 < 0) {
            break;
        }
        index = index2 + 1;
    }
    return ret.replace('&nbsp;', ' ');
}
String.prototype.removeHtmlTag = function () {
    var index1 = this.indexOf('<');
    if (index1 < 0) {
        return this;
    }
    var ret = '';
    var index = 0;
    while (true) {
        ret += this.substr(index, index1 - index);
        var index2 = this.indexOf('>', index1 + 1);
        if (index2 < 0) {
            break;
        }
        index = index2 + 1;
        index1 = this.indexOf('<', index);
        if (index1 < 0) {
            break;
        }
    }
    return ret.replace('&nbsp;', ' ');
}
String.prototype.getTdText = function () {
    var str = this.getString('>', '</td>');
    return str.removeHtmlTag() .trim();
}
String.prototype.format = function (args) {
    if (arguments.length > 0) {
        var result = this;
        if (arguments.length == 1 && typeof (args) == 'object') {
            for (var key in args) {
                var reg = new RegExp('({' + key + '})', 'g');
                result = result.replace(reg, args[key]);
            }
        } else {
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i] == undefined) {
                    return '';
                } else {
                    var reg = new RegExp('({[' + i + ']})', 'g');
                    result = result.replace(reg, arguments[i]);
                }
            }
        }
        return result;
    } else {
        return this;
    }
}
function getImageName(url) {
    return url.getString('29x20/', '.gif');
}
function getQTs(code) {
    var url = 'http://flash.weather.com.cn/sk2/' + code + '.xml';
    var content = getContent(url);
    var tables = content.split('<qw');
    var qts = '';
    for (var m = 1; m < tables.length; m++) {
        var table = tables[m];
        var wd = table.getString('wd="', '"');
        var sd = table.getString('sd="', '"');
        var h = table.getString('h="', '"');
        qt = '{"wd":"{0}","sd":"{1}","h":"{2}"}'.format(wd, sd, h);
        if (qts.length == 0) {
            qts = '[' + qt;
        } else {
            qts += ',\n' + qt;
        }
    }
    if (qts.length > 0) {
        qts += ']';
    }
    return qts;
}
function getRealWeather(code) {
    var url = 'http://www.weather.com.cn/data/sk/' + code + '.html';
    var content = getContent(url);
    return content.getString('{"weatherinfo":', '}') + '}';
}
function getWeather(code) {
    var isTest = (code.length == 2);
    var content = '';
    if (isTest) {
        content = document.body.innerHTML;
    } else {
        var url = 'http://www.weather.com.cn/html/weather/' + code + '.shtml';
        content = getContent(url);
    }
    var today = content.getString('id="live">', '<!--');
    var sunset;
    var sunrise;
    var text = content.getString('今日日出日落时间', '</dd>');
    if (text) {
        sunrise = text.getString('<strong style="font-size:16px;color:#000;font-weight:bold;">', '</strong>');
        sunset = text.getString('<strong style="font-size:16px;color:#000;font-weight:bold;">', '</strong>');
        text = content.getString('明日日出日落时间', '</dd>');
        sunrise2 = text.getString('<strong style="font-size:16px;color:#000;font-weight:bold;">', '</strong>');
        sunset2 = text.getString('<strong style="font-size:16px;color:#000;font-weight:bold;">', '</strong>');
    } else {
        text = content.getString('<p><b>今日</b>', '</span></p>');
        sunrise = text.getString('<span>', '</span>');
        sunset = text.getString('</span><span>');
        text = content.getString('<p><b>明日</b>', '</span></p>');
        sunrise2 = text.getString('<span>', '</span>');
        sunset2 = text.getString('</span><span>');
    }
    content = content.removeComment();
    var time = content.getString('逐6小时天气预报 （', '发布）');
    text = content.getString('<div class="weatherYubaoBox">', '      </div>');
    var tables = text.split('<table class="yuBaoTable"');
    var weathers = '';
    for (var m = 1; m < tables.length; m++) {
        var table = tables[m];
        var trs = table.split('<tr>');
        var weather = '';
        if (trs.length > 2) {
            var tds = trs[1].split('<td ');
            var day = tds[1].getTdText();
            var imageD = getImageName(tds[3]);
            var weatherD = tds[4].getTdText();
            var hTemp = tds[5].getTdText() .getString(' ');
            var windD = tds[6].getTdText();
            tds = trs[2].split('<td ');
            var imageN = getImageName(tds[2]);
            var weatherN = tds[3].getTdText();
            var lTemp = tds[4].getTdText() .getString(' ');
            var windN = tds[5].getTdText();
            weather = '{"day":"{0}","imageD":"{1}","weatherD":"{2}","hTemp":"{3}","windN":"{4}","imageN":"{5}", "weatherN":"{6}", "lTemp":"{7}","windN":"{8}"}'.format(day, imageD, weatherD, hTemp, windD, imageN, weatherN, lTemp, windN);
        } else {
            var tds = trs[1].split('<td ');
            var day = tds[1].getTdText();
            var imageD = getImageName(tds[3]);
            var weatherD = tds[4].getTdText();
            var hTemp = tds[5].getTdText() .getString(' ');
            var windD = tds[6].getTdText();
            var dayNight = tds[2].getTdText();
            if (dayNight == '白天') {
                weather = '{"day":"{0}","imageD":"{1}","weatherD":"{2}","hTemp":"{3}","windD":"{4}"}'.format(day, imageD, weatherD, hTemp, windD);
            } else {
                weather = '{"day":"{0}","imageN":"{1}","weatherN":"{2}","lTemp":"{3}","windN":"{4}"}'.format(day, imageD, weatherD, hTemp, windD);
            }
        }
        if (weather.length > 0) {
            if (weathers.length == 0) {
                weathers = '[' + weather;
            } else {
                weathers += ',\n' + weather;
            }
        }
    }
    if (weathers.length > 0) {
        weathers += ']';
    }
    text = content.getString('div id="aboutZS"', '<div class="adposter_6123">');
    var lis = text.split('<li');
    var points = '';
    for (var m = 1; m < lis.length; m++) {
        var li = lis[m];
        var type = li.getString('title="', '"');
        var strength = li.getString('<aside><b>', '</b>') .trim();
        var pic = li.getString('class="detail ', '"');
        if (type.length == 0) {
            type = li.getString('<h3><a><b>', '</b>');
        }
        var comment = li.getString('</b>', '</aside>') .trim();
        var point = '{"name":"{0}", "strength":"{1}", "comment":"{2}", "pic":"{3}"}'.format(type, strength, comment, pic);
        if (points.length == 0) {
            points = '[' + point;
        } else {
            points += ',' + point;
        }
    }
    if (points.length > 0) {
        points += ']';
    }
    weathers = '{"today":"{0}","time":"{1}","sunrise":"{2}","sunset":"{3}","sunrise2":"{4}","sunset2":"{5}", "weather":"{6}",\n"weathers":{7},\n"points":{8}}'.format(today, time, sunrise, sunset, sunrise2, sunset2, weatherD, weathers, points);
    if (isTest) {
        alert(weathers);
        //var d = eval('(' + weathers + ')');
    }
    return weathers;
}
function allPoints() {
    return '["穿衣指数", "感冒指数", "紫外线指数", "舒适度指数", "运动指数", "晨练指数", "太阳镜指数", "旅游指数", "化妆指数", "紫外线指数", "逛街指数", "美发指数", "雨伞指数", "交通指数", "路况指数", "钓鱼指数", "划船指数", "约会指数", "晾晒指数", "防晒指数"]';
}
function getDefaultCities() {
    return '["010101", "020101", "280101"]';
}

