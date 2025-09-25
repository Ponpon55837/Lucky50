/**
 * Lucky50 - 農民曆系統
 * 處理農民曆相關計算與吉凶判斷
 */

class LunarCalendar {
    constructor() {
        // 天干
        this.heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
        
        // 地支
        this.earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
        
        // 生肖對應
        this.zodiacAnimals = ['鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊', '猴', '雞', '狗', '豬'];
        
        // 五行
        this.fiveElements = {
            '甲': '木', '乙': '木',
            '丙': '火', '丁': '火',
            '戊': '土', '己': '土',
            '庚': '金', '辛': '金',
            '壬': '水', '癸': '水',
            '子': '水', '亥': '水',
            '寅': '木', '卯': '木',
            '巳': '火', '午': '火',
            '申': '金', '酉': '金',
            '辰': '土', '戌': '土', '丑': '土', '未': '土'
        };
        
        // 吉凶宜忌數據
        this.dailyActivities = {
            吉: ['祭祀', '開市', '交易', '立券', '納財', '開光', '求嗣', '出行', '移徙'],
            忌: ['安葬', '破土', '啟鑽', '修墳', '動土', '造橋', '作灶', '入宅']
        };
    }

    /**
     * 根據日期計算干支
     */
    getStemBranch(date) {
        const baseDate = new Date('1900-01-31'); // 庚子年正月初一
        const diffDays = Math.floor((date - baseDate) / (1000 * 60 * 60 * 24));
        
        const stemIndex = (diffDays + 6) % 10; // 6是庚的索引
        const branchIndex = (diffDays + 0) % 12; // 0是子的索引
        
        return {
            stem: this.heavenlyStems[stemIndex],
            branch: this.earthlyBranches[branchIndex],
            element: this.fiveElements[this.heavenlyStems[stemIndex]]
        };
    }

    /**
     * 計算生肖
     */
    getZodiac(birthYear) {
        const zodiacIndex = (birthYear - 1900) % 12;
        return this.zodiacAnimals[zodiacIndex];
    }

    /**
     * 根據出生信息計算八字
     */
    getBaZi(birthDate, birthTime) {
        const year = birthDate.getFullYear();
        const month = birthDate.getMonth() + 1;
        const day = birthDate.getDate();
        
        // 年柱
        const yearStemBranch = this.getYearStemBranch(year);
        
        // 月柱
        const monthStemBranch = this.getMonthStemBranch(year, month);
        
        // 日柱
        const dayStemBranch = this.getStemBranch(birthDate);
        
        // 時柱
        const hourStemBranch = this.getHourStemBranch(dayStemBranch.stem, birthTime);
        
        return {
            year: yearStemBranch,
            month: monthStemBranch,
            day: dayStemBranch,
            hour: hourStemBranch
        };
    }

    /**
     * 計算年柱干支
     */
    getYearStemBranch(year) {
        const stemIndex = (year - 1864) % 10;
        const branchIndex = (year - 1864) % 12;
        
        return {
            stem: this.heavenlyStems[stemIndex],
            branch: this.earthlyBranches[branchIndex],
            element: this.fiveElements[this.heavenlyStems[stemIndex]]
        };
    }

    /**
     * 計算月柱干支
     */
    getMonthStemBranch(year, month) {
        // 簡化計算，實際計算會更複雜
        const monthBranches = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
        const yearStem = this.getYearStemBranch(year).stem;
        const yearStemIndex = this.heavenlyStems.indexOf(yearStem);
        
        const monthStemIndex = (yearStemIndex * 2 + month + 1) % 10;
        const monthBranchIndex = (month + 1) % 12;
        
        return {
            stem: this.heavenlyStems[monthStemIndex],
            branch: monthBranches[month - 1],
            element: this.fiveElements[this.heavenlyStems[monthStemIndex]]
        };
    }

    /**
     * 計算時柱干支
     */
    getHourStemBranch(dayStem, hourBranch) {
        const dayStemIndex = this.heavenlyStems.indexOf(dayStem);
        const hourBranchIndex = this.earthlyBranches.indexOf(hourBranch);
        
        const hourStemIndex = (dayStemIndex * 2 + hourBranchIndex) % 10;
        
        return {
            stem: this.heavenlyStems[hourStemIndex],
            branch: hourBranch,
            element: this.fiveElements[this.heavenlyStems[hourStemIndex]]
        };
    }

    /**
     * 計算今日投資吉凶
     */
    getTodayFortune(date = new Date()) {
        const stemBranch = this.getStemBranch(date);
        const dayOfWeek = date.getDay();
        
        // 基於干支和星期計算運勢指數
        const stemScore = this.heavenlyStems.indexOf(stemBranch.stem) + 1;
        const branchScore = this.earthlyBranches.indexOf(stemBranch.branch) + 1;
        const weekScore = (dayOfWeek + 1) * 10;
        
        const totalScore = (stemScore + branchScore + weekScore) % 100;
        
        let fortune, advice, color;
        
        if (totalScore >= 80) {
            fortune = '大吉';
            advice = '今日投資運勢極佳，適合積極投資';
            color = '#10B981'; // 綠色
        } else if (totalScore >= 60) {
            fortune = '中吉';
            advice = '今日投資運勢良好，可適度投資';
            color = '#F59E0B'; // 黃色
        } else if (totalScore >= 40) {
            fortune = '平';
            advice = '今日投資運勢平平，宜謹慎觀察';
            color = '#6B7280'; // 灰色
        } else {
            fortune = '小凶';
            advice = '今日投資運勢不佳，建議觀望為主';
            color = '#EF4444'; // 紅色
        }
        
        return {
            date: date.toLocaleDateString('zh-TW'),
            stemBranch: `${stemBranch.stem}${stemBranch.branch}`,
            element: stemBranch.element,
            fortune,
            advice,
            score: totalScore,
            color,
            activities: this.getTodayActivities(totalScore)
        };
    }

    /**
     * 根據運勢分數獲取宜忌事項
     */
    getTodayActivities(score) {
        const suitable = [];
        const unsuitable = [];
        
        if (score >= 60) {
            suitable.push('開市', '交易', '納財', '投資');
            unsuitable.push('借貸', '大宗消費');
        } else {
            suitable.push('祭祀', '學習', '規劃');
            unsuitable.push('投資', '開市', '交易', '借貸');
        }
        
        return { suitable, unsuitable };
    }

    /**
     * 計算生肖與投資的相性
     */
    getZodiacInvestmentCompatibility(zodiac, date = new Date()) {
        const todayZodiac = this.getZodiac(date.getFullYear());
        const compatibility = this.calculateZodiacCompatibility(zodiac, todayZodiac);
        
        return {
            userZodiac: zodiac,
            todayZodiac,
            compatibility,
            recommendation: this.getCompatibilityRecommendation(compatibility)
        };
    }

    /**
     * 計算生肖相性
     */
    calculateZodiacCompatibility(zodiac1, zodiac2) {
        // 簡化的生肖相性計算
        const index1 = this.zodiacAnimals.indexOf(zodiac1);
        const index2 = this.zodiacAnimals.indexOf(zodiac2);
        const diff = Math.abs(index1 - index2);
        
        if (diff === 0) return 100;
        if (diff === 6) return 30; // 對沖
        if (diff === 1 || diff === 11) return 80; // 相鄰
        if (diff === 4 || diff === 8) return 90; // 三合
        
        return 60; // 一般
    }

    /**
     * 根據相性給出建議
     */
    getCompatibilityRecommendation(compatibility) {
        if (compatibility >= 90) {
            return { level: '極佳', advice: '今日特別適合投資決策' };
        } else if (compatibility >= 70) {
            return { level: '良好', advice: '今日適合進行投資操作' };
        } else if (compatibility >= 50) {
            return { level: '一般', advice: '今日投資需謹慎考慮' };
        } else {
            return { level: '不佳', advice: '今日不宜進行重大投資決策' };
        }
    }
}

// 導出類別
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LunarCalendar;
} else {
    window.LunarCalendar = LunarCalendar;
}