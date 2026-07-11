#!/usr/bin/env python3
"""
Korea Municipality Bitmap Mapping Tool
======================================
Usage:
  python3 bitmap_mapper.py <reference_image_path>

1단계: 화면에 표시되는 도시 이름 순서대로 그 레이블 위를 클릭 (캘리브레이션 5곳)
2단계: 나머지 시군구 레이블을 클릭 (스페이스=건너뛰기, Z=되돌리기)
3단계: 완료 후 centroid 배열이 output_centroids.js로 저장됨
"""

import sys
import json
import math
import tkinter as tk
from tkinter import ttk, messagebox
from PIL import Image, ImageTk

# ── 캘리브레이션 기준점 (SVG path 시작 좌표 - 정확한 값) ──
CALIBRATION = [
    {'id': 'incheon',  'name': '인천',  'svg_x': 113.8, 'svg_y': 124.4},
    {'id': 'busan',    'name': '부산',  'svg_x': 362.2, 'svg_y': 382.5},
    {'id': 'daejeon',  'name': '대전',  'svg_x': 192.8, 'svg_y': 261.0},
    {'id': 'daegu',    'name': '대구',  'svg_x': 298.1, 'svg_y': 351.1},
    {'id': 'gwangju',  'name': '광주',  'svg_x': 151.4, 'svg_y': 400.0},
]

# ── 전체 시군구 목록 ──
MUNICIPALITIES = [
    ('seoul',            'seoul',         '서울'),
    ('gyeonggi',         'yeoncheon',     '연천'),
    ('gyeonggi',         'pocheon',       '포천'),
    ('gyeonggi',         'yangju',        '양주'),
    ('gyeonggi',         'paju',          '파주'),
    ('gyeonggi',         'goyang',        '고양'),
    ('gyeonggi',         'gimpo',         '김포'),
    ('gyeonggi',         'ganghwa',       '강화'),
    ('gyeonggi',         'bucheon',       '부천'),
    ('gyeonggi',         'namyangju',     '남양주'),
    ('gyeonggi',         'guri',          '구리'),
    ('gyeonggi',         'hanam',         '하남'),
    ('gyeonggi',         'gapyeong',      '가평'),
    ('gyeonggi',         'seongnam',      '성남'),
    ('gyeonggi',         'gwangju',       '광주(경기)'),
    ('gyeonggi',         'yangpyeong',    '양평'),
    ('gyeonggi',         'yeoju',         '여주'),
    ('gyeonggi',         'icheon',        '이천'),
    ('gyeonggi',         'suwon',         '수원'),
    ('gyeonggi',         'yongin',        '용인'),
    ('gyeonggi',         'anseong',       '안성'),
    ('gyeonggi',         'hwaseong',      '화성'),
    ('gyeonggi',         'ansan-siheung', '안산/시흥'),
    ('gyeonggi',         'pyeongtaek',    '평택'),
    ('gyeonggi',         'osan',          '오산'),
    ('gangwon',          'cheorwon',      '철원'),
    ('gangwon',          'hwacheon',      '화천'),
    ('gangwon',          'yanggu',        '양구'),
    ('gangwon',          'goseong',       '고성(강원)'),
    ('gangwon',          'sokcho',        '속초'),
    ('gangwon',          'inje',          '인제'),
    ('gangwon',          'yangyang',      '양양'),
    ('gangwon',          'chuncheon',     '춘천'),
    ('gangwon',          'hongcheon',     '홍천'),
    ('gangwon',          'hoengseong',    '횡성'),
    ('gangwon',          'wonju',         '원주'),
    ('gangwon',          'pyeongchang',   '평창'),
    ('gangwon',          'gangneung',     '강릉'),
    ('gangwon',          'jeongseon',     '정선'),
    ('gangwon',          'yeongwool',     '영월'),
    ('gangwon',          'donghae',       '동해'),
    ('gangwon',          'taebaek',       '태백'),
    ('gangwon',          'samcheok',      '삼척'),
    ('south-chungcheong','taean',         '태안'),
    ('south-chungcheong','seosan',        '서산'),
    ('south-chungcheong','dangjin',       '당진'),
    ('south-chungcheong','yesan',         '예산'),
    ('south-chungcheong','hongseong',     '홍성'),
    ('south-chungcheong','boryeong',      '보령'),
    ('south-chungcheong','seocheon',      '서천'),
    ('south-chungcheong','asan',          '아산'),
    ('south-chungcheong','cheonan',       '천안'),
    ('south-chungcheong','cheongyang',    '청양'),
    ('south-chungcheong','gongju',        '공주'),
    ('south-chungcheong','buyeo',         '부여'),
    ('south-chungcheong','nonsan',        '논산'),
    ('south-chungcheong','gyeryong',      '계룡'),
    ('south-chungcheong','geumsan',       '금산'),
    ('north-chungcheong','jincheon',      '진천'),
    ('north-chungcheong','eumseong',      '음성'),
    ('north-chungcheong','chungju',       '충주'),
    ('north-chungcheong','jecheon',       '제천'),
    ('north-chungcheong','danyang',       '단양'),
    ('north-chungcheong','cheongju',      '청주'),
    ('north-chungcheong','goesan',        '괴산'),
    ('north-chungcheong','boeun',         '보은'),
    ('north-chungcheong','okcheon',       '옥천'),
    ('north-chungcheong','yeongdong',     '영동'),
    ('north-jeolla',     'gunsan',        '군산'),
    ('north-jeolla',     'iksan',         '익산'),
    ('north-jeolla',     'wanju',         '완주'),
    ('north-jeolla',     'jeonju',        '전주'),
    ('north-jeolla',     'gimje',         '김제'),
    ('north-jeolla',     'buan',          '부안'),
    ('north-jeolla',     'jeongeup',      '정읍'),
    ('north-jeolla',     'gochang',       '고창'),
    ('north-jeolla',     'imsil',         '임실'),
    ('north-jeolla',     'jinan',         '진안'),
    ('north-jeolla',     'muju',          '무주'),
    ('north-jeolla',     'jangsu',        '장수'),
    ('north-jeolla',     'namwon',        '남원'),
    ('north-jeolla',     'sunchang',      '순창'),
    ('south-jeolla',     'yeonggwang',    '영광'),
    ('south-jeolla',     'jangseong',     '장성'),
    ('south-jeolla',     'damyang',       '담양'),
    ('south-jeolla',     'hampyeong',     '함평'),
    ('south-jeolla',     'hwasun',        '화순'),
    ('south-jeolla',     'gokseong',      '곡성'),
    ('south-jeolla',     'gurye',         '구례'),
    ('south-jeolla',     'naju',          '나주'),
    ('south-jeolla',     'muan',          '무안'),
    ('south-jeolla',     'mokpo',         '목포'),
    ('south-jeolla',     'yeongam',       '영암'),
    ('south-jeolla',     'boseong',       '보성'),
    ('south-jeolla',     'suncheon',      '순천'),
    ('south-jeolla',     'gwangyang',     '광양'),
    ('south-jeolla',     'yeosu',         '여수'),
    ('south-jeolla',     'jangheung',     '장흥'),
    ('south-jeolla',     'gangjin',       '강진'),
    ('south-jeolla',     'haenam',        '해남'),
    ('south-jeolla',     'wando',         '완도'),
    ('south-jeolla',     'jindo',         '진도'),
    ('south-jeolla',     'shinan',        '신안'),
    ('north-gyeongsang', 'yeongju',       '영주'),
    ('north-gyeongsang', 'bonghwa',       '봉화'),
    ('north-gyeongsang', 'uljin',         '울진'),
    ('north-gyeongsang', 'yeongyang',     '영양'),
    ('north-gyeongsang', 'andong',        '안동'),
    ('north-gyeongsang', 'yeongdeok',     '영덕'),
    ('north-gyeongsang', 'mungyeong',     '문경'),
    ('north-gyeongsang', 'yecheon',       '예천'),
    ('north-gyeongsang', 'cheongsong',    '청송'),
    ('north-gyeongsang', 'sangju',        '상주'),
    ('north-gyeongsang', 'uiseong',       '의성'),
    ('north-gyeongsang', 'pohang',        '포항'),
    ('north-gyeongsang', 'gimcheon',      '김천'),
    ('north-gyeongsang', 'gumi',          '구미'),
    ('north-gyeongsang', 'gunwi',         '군위'),
    ('north-gyeongsang', 'yeongcheon',    '영천'),
    ('north-gyeongsang', 'seongju',       '성주'),
    ('north-gyeongsang', 'chilgok',       '칠곡'),
    ('north-gyeongsang', 'goryeong',      '고령'),
    ('north-gyeongsang', 'cheongdo',      '청도'),
    ('north-gyeongsang', 'gyeongju',      '경주'),
    ('north-gyeongsang', 'gyeongsan',     '경산'),
    ('south-gyeongsang', 'ulsan',         '울산'),
    ('south-gyeongsang', 'geochang',      '거창'),
    ('south-gyeongsang', 'hamyang',       '함양'),
    ('south-gyeongsang', 'hapcheon',      '합천'),
    ('south-gyeongsang', 'changnyeong',   '창녕'),
    ('south-gyeongsang', 'miryang',       '밀양'),
    ('south-gyeongsang', 'yangsan',       '양산'),
    ('south-gyeongsang', 'sancheong',     '산청'),
    ('south-gyeongsang', 'jinju',         '진주'),
    ('south-gyeongsang', 'uiryeong',      '의령'),
    ('south-gyeongsang', 'haman',         '함안'),
    ('south-gyeongsang', 'gimhae',        '김해'),
    ('south-gyeongsang', 'changwon',      '창원'),
    ('south-gyeongsang', 'hadong',        '하동'),
    ('south-gyeongsang', 'sacheon',       '사천'),
    ('south-gyeongsang', 'goseong-gn',    '고성(경남)'),
    ('south-gyeongsang', 'namhae',        '남해'),
    ('south-gyeongsang', 'tongyeong',     '통영'),
    ('south-gyeongsang', 'geoje',         '거제'),
    ('jeju',             'jeju',          '제주'),
    ('jeju',             'seogwipo',      '서귀포'),
]


def least_squares_affine(img_pts, svg_pts):
    n = len(img_pts)
    sum_x = sum(p[0] for p in img_pts)
    sum_y = sum(p[1] for p in img_pts)
    sum_xx = sum(p[0]**2 for p in img_pts)
    sum_yy = sum(p[1]**2 for p in img_pts)
    sum_sx = sum(svg_pts[i][0] for i in range(n))
    sum_sy = sum(svg_pts[i][1] for i in range(n))
    sum_x_sx = sum(img_pts[i][0] * svg_pts[i][0] for i in range(n))
    sum_y_sy = sum(img_pts[i][1] * svg_pts[i][1] for i in range(n))

    denom_x = n * sum_xx - sum_x**2
    ax = (n * sum_x_sx - sum_x * sum_sx) / denom_x
    bx = (sum_sx - ax * sum_x) / n

    denom_y = n * sum_yy - sum_y**2
    ay = (n * sum_y_sy - sum_y * sum_sy) / denom_y
    by = (sum_sy - ay * sum_y) / n

    return ax, bx, ay, by


class BitmapMapper:
    def __init__(self, image_path):
        self.root = tk.Tk()
        self.root.title("Korea Municipality Bitmap Mapper")

        self.orig_img = Image.open(image_path)
        self.img_w, self.img_h = self.orig_img.size

        # Scale to fit screen
        max_h = 900
        scale = min(1.0, max_h / self.img_h)
        self.display_w = int(self.img_w * scale)
        self.display_h = int(self.img_h * scale)
        self.scale = scale
        display_img = self.orig_img.resize((self.display_w, self.display_h), Image.LANCZOS)
        self.tk_img = ImageTk.PhotoImage(display_img)

        self.calib_img_pts = []
        self.calib_svg_pts = []
        self.results = {}
        self.skipped = set()
        self.current_muni_idx = 0
        self.phase = 'calibration'
        self.calib_idx = 0
        self.ax = self.bx = self.ay = self.by = None
        self.click_markers = []

        self._build_ui()
        self.root.bind('<space>', self._skip)
        self.root.bind('<z>', self._undo)
        self.root.bind('<Z>', self._undo)
        self._update_instruction()

    def _build_ui(self):
        self.canvas = tk.Canvas(self.root, width=self.display_w, height=self.display_h,
                                cursor='crosshair', bg='white')
        self.canvas.pack(side='left', fill='both', expand=True)
        self.canvas.create_image(0, 0, anchor='nw', image=self.tk_img)
        self.canvas.bind('<Button-1>', self._on_click)

        panel = tk.Frame(self.root, width=290, padx=10, pady=10)
        panel.pack(side='right', fill='y')
        panel.pack_propagate(False)

        self.phase_label = tk.Label(panel, text='', font=('Helvetica', 14, 'bold'),
                                    fg='#1a1a2e', wraplength=270, justify='center')
        self.phase_label.pack(pady=(10, 5))

        self.instr_label = tk.Label(panel, text='', font=('Helvetica', 14),
                                    fg='#e63946', wraplength=270, justify='center')
        self.instr_label.pack(pady=5)

        self.sub_label = tk.Label(panel, text='', font=('Helvetica', 10),
                                  fg='#555', wraplength=270, justify='center')
        self.sub_label.pack(pady=3)

        ttk.Separator(panel, orient='horizontal').pack(fill='x', pady=8)

        self.progress_var = tk.StringVar()
        tk.Label(panel, textvariable=self.progress_var,
                 font=('Helvetica', 10), fg='#333').pack()

        ttk.Separator(panel, orient='horizontal').pack(fill='x', pady=8)

        tk.Label(panel, text='완료 목록:', font=('Helvetica', 10, 'bold')).pack(anchor='w')
        sb = tk.Scrollbar(panel)
        sb.pack(side='right', fill='y')
        self.done_listbox = tk.Listbox(panel, height=22, font=('Helvetica', 9),
                                        yscrollcommand=sb.set)
        self.done_listbox.pack(fill='both', expand=True)
        sb.config(command=self.done_listbox.yview)

        btn_frame = tk.Frame(panel)
        btn_frame.pack(pady=8)
        tk.Button(btn_frame, text='건너뛰기 [Space]', command=self._skip, width=18).pack(pady=2)
        tk.Button(btn_frame, text='되돌리기 [Z]', command=self._undo, width=18).pack(pady=2)
        tk.Button(btn_frame, text='저장 & 종료', command=self._finish,
                  bg='#2d6a4f', fg='white', width=18, font=('Helvetica', 11, 'bold')).pack(pady=4)

    def _update_instruction(self):
        if self.phase == 'calibration':
            city = CALIBRATION[self.calib_idx]
            self.phase_label.config(
                text=f'[캘리브레이션 {self.calib_idx+1}/{len(CALIBRATION)}]')
            self.instr_label.config(text=f'「{city["name"]}」\n클릭')
            self.sub_label.config(text='도시 이름 텍스트 중앙을 클릭')
            self.progress_var.set('캘리브레이션 완료 후 매핑 시작')
        else:
            idx = self.current_muni_idx
            total = len(MUNICIPALITIES)
            prov, mid, name = MUNICIPALITIES[idx]
            self.phase_label.config(text=f'[매핑 {idx+1}/{total}]')
            self.instr_label.config(text=f'「{name}」\n클릭')
            self.sub_label.config(text=f'({prov})\n[Space]=건너뛰기  [Z]=되돌리기')
            done = len(self.results) + len(self.skipped)
            self.progress_var.set(f'완료: {done}/{total}  |  건너뜀: {len(self.skipped)}')

    def _on_click(self, event):
        img_x = event.x / self.scale
        img_y = event.y / self.scale

        r = 5
        marker = self.canvas.create_oval(event.x-r, event.y-r, event.x+r, event.y+r,
                                          fill='red', outline='white', width=1)
        num_txt = self.canvas.create_text(event.x+9, event.y-8,
                                           text=str(len(self.click_markers)+1),
                                           fill='red', font=('Helvetica', 8, 'bold'))
        self.click_markers.append((marker, num_txt, img_x, img_y))

        if self.phase == 'calibration':
            city = CALIBRATION[self.calib_idx]
            self.calib_img_pts.append((img_x, img_y))
            self.calib_svg_pts.append((city['svg_x'], city['svg_y']))
            self.done_listbox.insert('end', f'CAL {city["name"]} img=({img_x:.0f},{img_y:.0f})')
            self.calib_idx += 1

            if self.calib_idx >= len(CALIBRATION):
                self.ax, self.bx, self.ay, self.by = least_squares_affine(
                    self.calib_img_pts, self.calib_svg_pts)
                self.phase = 'mapping'
                self.done_listbox.insert('end', '──────────────')
                self.done_listbox.insert('end',
                    f'변환: x={self.ax:.4f}*px+{self.bx:.1f}')
                self.done_listbox.insert('end',
                    f'     y={self.ay:.4f}*py+{self.by:.1f}')
                self.done_listbox.insert('end', '──────────────')
                messagebox.showinfo('캘리브레이션 완료!',
                    f'변환 계수:\n'
                    f'  SVG_x = {self.ax:.4f} × img_x + {self.bx:.2f}\n'
                    f'  SVG_y = {self.ay:.4f} × img_y + {self.by:.2f}\n\n'
                    '이제 시군구 레이블을 순서대로 클릭하세요.\n'
                    'Space=건너뛰기, Z=되돌리기')
        else:
            svg_x = self.ax * img_x + self.bx
            svg_y = self.ay * img_y + self.by
            prov, mid, name = MUNICIPALITIES[self.current_muni_idx]
            self.results[mid] = {
                'province': prov, 'x': round(svg_x, 1),
                'y': round(svg_y, 1), 'name': name
            }
            self.done_listbox.insert('end',
                f'{name} ({round(svg_x)},{round(svg_y)})')
            self.done_listbox.see('end')
            self.current_muni_idx += 1
            if self.current_muni_idx >= len(MUNICIPALITIES):
                self._finish()
                return

        self._update_instruction()

    def _skip(self, event=None):
        if self.phase != 'mapping':
            return
        prov, mid, name = MUNICIPALITIES[self.current_muni_idx]
        self.skipped.add(mid)
        self.done_listbox.insert('end', f'SKIP {name}')
        self.done_listbox.see('end')
        self.current_muni_idx += 1
        if self.current_muni_idx >= len(MUNICIPALITIES):
            self._finish()
            return
        self._update_instruction()

    def _undo(self, event=None):
        if self.phase == 'mapping' and self.current_muni_idx > 0:
            self.current_muni_idx -= 1
            prov, mid, name = MUNICIPALITIES[self.current_muni_idx]
            self.results.pop(mid, None)
            self.skipped.discard(mid)
            if self.click_markers:
                m, t, _, _ = self.click_markers.pop()
                self.canvas.delete(m)
                self.canvas.delete(t)
            self.done_listbox.delete('end')
            self._update_instruction()

    def _finish(self):
        if self.ax is None:
            messagebox.showwarning('경고', '캘리브레이션을 먼저 완료하세요.')
            return

        lines = [
            '// === 비트맵 매핑 결과 (bitmap_mapper.py 자동생성) ===',
            '// index.html의 municipalCentroids 배열에 붙여넣으세요\n',
        ]

        province_order = [
            'seoul', 'gyeonggi', 'gangwon',
            'south-chungcheong', 'north-chungcheong',
            'north-jeolla', 'south-jeolla',
            'north-gyeongsang', 'south-gyeongsang', 'jeju'
        ]

        by_province = {}
        for mid, info in self.results.items():
            by_province.setdefault(info['province'], []).append((mid, info))

        for prov in province_order:
            if prov not in by_province:
                continue
            lines.append(f'                // {prov}')
            for mid, info in by_province[prov]:
                lines.append(
                    f"                {{ id: '{mid}', x: {info['x']}, "
                    f"y: {info['y']}, province: '{prov}' }}, // {info['name']}"
                )
            lines.append('')

        if self.skipped:
            lines.append(f'// 건너뜀: ' + ', '.join(self.skipped))

        output = '\n'.join(lines)
        with open('output_centroids.js', 'w', encoding='utf-8') as f:
            f.write(output)
        with open('output_centroids.json', 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)

        print('\n' + output)
        messagebox.showinfo('저장 완료',
            f'output_centroids.js 저장 완료!\n'
            f'매핑: {len(self.results)}개  |  건너뜀: {len(self.skipped)}개')
        self.root.destroy()

    def run(self):
        self.root.mainloop()


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('사용법: python3 bitmap_mapper.py <이미지_경로>')
        print('예시: python3 bitmap_mapper.py ~/Desktop/korea_map.png')
        sys.exit(1)
    BitmapMapper(sys.argv[1]).run()
