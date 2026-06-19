(function () {
  var items = [
    { my: "နိုင်ငံကူးလက်မှတ်", cn: "护照", cat: "政府办事" },
    { my: "ဗီဇာ", cn: "签证", cat: "政府办事" },
    { my: "မှတ်ပုံတင်", cn: "身份证", cat: "政府办事" },
    { my: "ဖောင်", cn: "表格", cat: "政府办事" },
    { my: "မိတ္တူ", cn: "复印件", cat: "政府办事" },
    { my: "လက်မှတ်", cn: "签名 / 票", cat: "政府办事" },
    { my: "ရက်ချိန်း", cn: "预约 / 日期", cat: "政府办事" },
    { my: "တန်းစီနံပါတ်", cn: "排队号码", cat: "政府办事" },
    { my: "ကောင်တာ", cn: "柜台", cat: "政府办事" },
    { my: "ပြေစာ", cn: "收据", cat: "政府办事" },
    { my: "ဝန်ဆောင်ခ", cn: "手续费", cat: "政府办事" },
    { my: "အခွန်", cn: "税费", cat: "政府办事" },
    { my: "ဒဏ်ငွေ", cn: "罚款", cat: "政府办事" },
    { my: "ထောက်ခံစာ", cn: "证明信", cat: "政府办事" },
    { my: "အိမ်ထောင်စုစာရင်း", cn: "户口 / 家庭登记", cat: "政府办事" },
    { my: "လိပ်စာ", cn: "地址", cat: "政府办事" },
    { my: "ရုံး", cn: "办公室 / 政府部门", cat: "政府办事" },
    { my: "တာဝန်ရှိသူ", cn: "负责人", cat: "政府办事" },
    { my: "ခွင့်ပြုချက်", cn: "许可 / 批准", cat: "政府办事" },
    { my: "လိုင်စင်", cn: "许可证 / 驾照", cat: "政府办事" },
    { my: "ဘဏ်အကောင့်", cn: "银行账户", cat: "银行支付" },
    { my: "ငွေလွှဲ", cn: "转账", cat: "银行支付" },
    { my: "ငွေထုတ်", cn: "取钱", cat: "银行支付" },
    { my: "ငွေသွင်း", cn: "存钱", cat: "银行支付" },
    { my: "အတိုး", cn: "利息", cat: "银行支付" },
    { my: "ကတ်", cn: "银行卡 / 卡", cat: "银行支付" },
    { my: "စကားဝှက်", cn: "密码", cat: "银行支付" },
    { my: "ငွေလက်ခံ", cn: "收款", cat: "银行支付" },
    { my: "ငွေပေးချေ", cn: "付款", cat: "银行支付" },
    { my: "အွန်လိုင်းပေးချေမှု", cn: "线上支付", cat: "银行支付" },
    { my: "ဆင်းမ်ကတ်", cn: "手机卡", cat: "手机通信" },
    { my: "ဖုန်းဘေလ်", cn: "话费", cat: "手机通信" },
    { my: "အင်တာနက်", cn: "网络", cat: "手机通信" },
    { my: "ဒေတာ", cn: "流量", cat: "手机通信" },
    { my: "ဖုန်းနံပါတ်", cn: "电话号码", cat: "手机通信" },
    { my: "မက်ဆေ့ခ်ျ", cn: "短信", cat: "手机通信" },
    { my: "ခေါ်ဆိုမှု", cn: "电话通话", cat: "手机通信" },
    { my: "ဝိုင်ဖိုင်", cn: "Wi-Fi", cat: "手机通信" },
    { my: "အားသွင်းကြိုး", cn: "充电线", cat: "手机通信" },
    { my: "အားသွင်းစက်", cn: "充电器", cat: "手机通信" },
    { my: "ဆေးရုံ", cn: "医院", cat: "医疗药店" },
    { my: "ဆေးခန်း", cn: "诊所", cat: "医疗药店" },
    { my: "ဆရာဝန်", cn: "医生", cat: "医疗药店" },
    { my: "သူနာပြု", cn: "护士", cat: "医疗药店" },
    { my: "ဆေးဆိုင်", cn: "药店", cat: "医疗药店" },
    { my: "ဆေး", cn: "药", cat: "医疗药店" },
    { my: "ဆေးစာ", cn: "处方", cat: "医疗药店" },
    { my: "အဖျား", cn: "发烧", cat: "医疗药店" },
    { my: "ခေါင်းကိုက်", cn: "头痛", cat: "医疗药店" },
    { my: "ဗိုက်နာ", cn: "肚子痛", cat: "医疗药店" },
    { my: "ချောင်းဆိုး", cn: "咳嗽", cat: "医疗药店" },
    { my: "အာမခံ", cn: "保险", cat: "医疗药店" },
    { my: "ဟိုတယ်", cn: "酒店", cat: "住宿租房" },
    { my: "အခန်း", cn: "房间", cat: "住宿租房" },
    { my: "သော့", cn: "钥匙", cat: "住宿租房" },
    { my: "ရေချိုးခန်း", cn: "浴室", cat: "住宿租房" },
    { my: "မီး", cn: "电 / 灯", cat: "住宿租房" },
    { my: "ရေ", cn: "水", cat: "住宿租房" },
    { my: "ငှားခ", cn: "租金", cat: "住宿租房" },
    { my: "အိမ်ရှင်", cn: "房东", cat: "住宿租房" },
    { my: "သန့်ရှင်းရေး", cn: "清洁", cat: "住宿租房" },
    { my: "ပြင်ဆင်", cn: "维修", cat: "住宿租房" },
    { my: "တက္ကစီ", cn: "出租车", cat: "交通出行" },
    { my: "ဘတ်စ်ကား", cn: "公交车", cat: "交通出行" },
    { my: "ရထား", cn: "火车", cat: "交通出行" },
    { my: "မှတ်တိုင်", cn: "车站 / 站点", cat: "交通出行" },
    { my: "လမ်းဆုံ", cn: "路口", cat: "交通出行" },
    { my: "ဘယ်ဘက်", cn: "左边", cat: "交通出行" },
    { my: "ညာဘက်", cn: "右边", cat: "交通出行" },
    { my: "တည့်တည့်", cn: "直走", cat: "交通出行" },
    { my: "အနီး", cn: "附近", cat: "交通出行" },
    { my: "အဝေး", cn: "远处", cat: "交通出行" },
    { my: "ဈေး", cn: "市场 / 价格", cat: "购物吃饭" },
    { my: "ဆိုင်", cn: "商店", cat: "购物吃饭" },
    { my: "လျှော့ဈေး", cn: "折扣", cat: "购物吃饭" },
    { my: "အရွယ်အစား", cn: "尺寸", cat: "购物吃饭" },
    { my: "အရောင်", cn: "颜色", cat: "购物吃饭" },
    { my: "အထုပ်", cn: "袋子 / 包", cat: "购物吃饭" },
    { my: "စားသောက်ဆိုင်", cn: "餐厅", cat: "购物吃饭" },
    { my: "မီနူး", cn: "菜单", cat: "购物吃饭" },
    { my: "ထမင်း", cn: "米饭", cat: "购物吃饭" },
    { my: "ဟင်း", cn: "菜 / 咖喱", cat: "购物吃饭" },
    { my: "အချို", cn: "甜", cat: "购物吃饭" },
    { my: "အစပ်", cn: "辣", cat: "购物吃饭" },
    { my: "ရေခဲ", cn: "冰", cat: "购物吃饭" },
    { my: "အလုပ်", cn: "工作", cat: "工作社交" },
    { my: "အစည်းအဝေး", cn: "会议", cat: "工作社交" },
    { my: "သူငယ်ချင်း", cn: "朋友", cat: "工作社交" },
    { my: "မိသားစု", cn: "家人", cat: "工作社交" },
    { my: "အချိန်", cn: "时间", cat: "工作社交" },
    { my: "မနက်ဖြန်", cn: "明天", cat: "工作社交" },
    { my: "မနေ့က", cn: "昨天", cat: "工作社交" },
    { my: "အရေးကြီး", cn: "重要", cat: "工作社交" },
    { my: "အမြန်", cn: "快 / 紧急", cat: "工作社交" },
    { my: "ဖြည်းဖြည်း", cn: "慢慢地", cat: "工作社交" },
    { my: "ရဲစခန်း", cn: "警察局", cat: "紧急情况" },
    { my: "မီးသတ်", cn: "消防", cat: "紧急情况" },
    { my: "အရေးပေါ်", cn: "紧急", cat: "紧急情况" },
    { my: "ကူညီပါ", cn: "请帮忙", cat: "紧急情况" },
    { my: "ပျောက်သွား", cn: "丢失了", cat: "紧急情况" }
  ];

  var patterns = [
    function (item) {
      return { word: item.my, meaning: item.cn, example: "ဒီဟာ " + item.my + " ပါ။", exampleCn: "这是" + item.cn + "。" };
    },
    function (item) {
      return { word: item.my + " လိုပါတယ်", meaning: "需要" + item.cn, example: item.my + " လိုပါတယ်။", exampleCn: "我需要" + item.cn + "。" };
    },
    function (item) {
      return { word: item.my + " ဘယ်မှာလဲ", meaning: item.cn + "在哪里", example: item.my + " ဘယ်မှာလဲ။", exampleCn: item.cn + "在哪里？" };
    },
    function (item) {
      return { word: item.my + " ရှိပါသလား", meaning: "有" + item.cn + "吗", example: item.my + " ရှိပါသလား။", exampleCn: "有" + item.cn + "吗？" };
    },
    function (item) {
      return { word: item.my + " အတွက် အကူအညီ လိုပါတယ်", meaning: "关于" + item.cn + "需要帮助", example: item.my + " အတွက် အကူအညီ လိုပါတယ်။", exampleCn: "关于" + item.cn + "我需要帮助。" };
    },
    function (item) {
      return { word: item.my + " ကို နားမလည်ပါဘူး", meaning: "不明白" + item.cn, example: item.my + " ကို နားမလည်ပါဘူး။", exampleCn: "我不明白" + item.cn + "。" };
    },
    function (item) {
      return { word: item.my + " နဲ့ ပတ်သက်ပြီး ပြောပြပါ", meaning: "请说明关于" + item.cn + "的事情", example: item.my + " နဲ့ ပတ်သက်ပြီး ပြောပြပါ။", exampleCn: "请说明关于" + item.cn + "的事情。" };
    }
  ];

  var generated = [];
  var id = 301;
  for (var i = 0; i < items.length && id <= 1000; i += 1) {
    for (var p = 0; p < patterns.length && id <= 1000; p += 1) {
      var phrase = patterns[p](items[i]);
      generated.push({
        id: id,
        word: phrase.word,
        phonetic: "",
        meaning: phrase.meaning,
        example: phrase.example,
        exampleCn: phrase.exampleCn,
        category: items[i].cat
      });
      id += 1;
    }
  }

  window.EXTRA_WORDS = (window.EXTRA_WORDS || []).concat(generated);
})();
