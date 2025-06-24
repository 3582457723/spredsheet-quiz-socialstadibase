const SPREADSHEET_ID = '1ZjWFPe-iPAOP9D_LBf2_44DIJtVkye1BwGx7oxMAEaQ';

// HTML出力
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('社会クイズ');
}

// クイズ問題をランダムに取得（最大20問）
function getRandomQuestions() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Questions');
  const data = sheet.getDataRange().getValues();
  const questions = [];

  for (let i = 1; i < data.length; i++) { // 1行目はヘッダー
    const q = data[i][0];
    const a = data[i][1];
    if (q && a) {
      questions.push({ question: q, answer: a.toString().trim() });
    }
  }

  // シャッフル（Fisher-Yates）
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  return questions.slice(0, 10);
}


// クライアントから送られた回答が正解かを返す（必要に応じて使用）
function checkAnswer(question, userAnswer) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Questions');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === question) {
      return data[i][1].toString().trim() === userAnswer.toString().trim();
    }
  }
  return false;
}

// スコア保存（全モード）
function submitScore(data) {
  const modes = ['ランキング', getDateLabel('season'), getDateLabel('weekly'), getDateLabel('daily')];

  modes.forEach(sheetName => {
    const sheet = getRankingSheet(sheetName);
    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
    let updated = false;

    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === data.name) {
        if (data.score > values[i][1]) {
          sheet.getRange(i + 2, 2).setValue(data.score);
          sheet.getRange(i + 2, 3).setValue(new Date());
        }
        updated = true;
        break;
      }
    }

    if (!updated) {
      sheet.appendRow([data.name, data.score, new Date()]);
    }
  });
}

// 指定された名前のランキングシートを取得または作成
function getRankingSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['名前', 'スコア', '日時']);
  } else if (sheet.getLastRow() === 0 || sheet.getRange(1, 1).getValue() !== '名前') {
    sheet.insertRows(1);
    sheet.getRange(1, 1, 1, 3).setValues([['名前', 'スコア', '日時']]);
  }

  return sheet;
}

// ラベル作成（デイリー・ウィークリー・シーズン別）
function getDateLabel(type) {
  const now = new Date();
  const year = now.getFullYear();
  const month = ('0' + (now.getMonth() + 1)).slice(-2);
  const date = ('0' + now.getDate()).slice(-2);
  const week = Math.ceil((now.getDate() - 1 + new Date(year, now.getMonth(), 1).getDay()) / 7);

  if (type === 'season') return `Season_${year}_${month}`;
  if (type === 'weekly') return `Week_${year}_W${week}`;
  if (type === 'daily')  return `Day_${year}_${month}_${date}`;
  return 'ランキング';
}
