import test from 'node:test';
import assert from 'node:assert/strict';
import { getHighlightLevel, stripHighlightPrefix, toTitle, toSub, toItem } from '../highlightLevel.ts';

test('getHighlightLevel 识别主标题【】', () => {
  assert.equal(getHighlightLevel('【板块一】Harness 工程推广'), 'title');
  assert.equal(getHighlightLevel('【板块二】xxx'), 'title');
});

test('getHighlightLevel 识别子条目（前导缩进）', () => {
  assert.equal(getHighlightLevel('  业务线接入推广：xxx'), 'sub');
  assert.equal(getHighlightLevel('\t缩进子项'), 'sub');
});

test('getHighlightLevel 识别普通亮点', () => {
  assert.equal(getHighlightLevel('业务线接入推广：xxx'), 'item');
  assert.equal(getHighlightLevel('普通条目'), 'item');
  assert.equal(getHighlightLevel(''), 'item');
});

test('stripHighlightPrefix 主标题去【】', () => {
  assert.deepEqual(stripHighlightPrefix('【板块一】Harness'), { level: 'title', text: '板块一：Harness' });
});

test('toTitle 包【】并去重', () => {
  assert.equal(toTitle('板块一'), '【板块一】');
  assert.equal(toTitle('【板块一】'), '【板块一】');
});

test('toSub 前置缩进去重', () => {
  assert.equal(toSub('业务线'), '  业务线');
  assert.equal(toSub('  业务线'), '  业务线');
});

test('toItem 去【】和缩进', () => {
  assert.equal(toItem('【板块一】'), '板块一');
  assert.equal(toItem('  业务线'), '业务线');
  assert.equal(toItem('普通'), '普通');
});

test('toItem 去【】包裹（含正文）', () => {
  assert.equal(toItem('【板块一】xxx'), '板块一xxx');
});
