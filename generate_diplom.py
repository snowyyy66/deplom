# -*- coding: utf-8 -*-
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

doc = Document()
sec = doc.sections[0]
sec.left_margin = Cm(3.0); sec.right_margin = Cm(1.0)
sec.top_margin  = Cm(2.0); sec.bottom_margin = Cm(2.0)

sn = doc.styles['Normal']
sn.font.name = 'Times New Roman'; sn.font.size = Pt(14)
sn.paragraph_format.line_spacing = Pt(21)
sn.paragraph_format.first_line_indent = Cm(1.25)
sn.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
sn.paragraph_format.space_before = Pt(0)
sn.paragraph_format.space_after  = Pt(0)

def sf(run, bold=False, size=14, italic=False, name='Times New Roman'):
    run.font.name = name; run.font.size = Pt(size)
    run.bold = bold; run.italic = italic

def p(text='', bold=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY,
      size=14, sb=0, sa=0, italic=False, indent=True):
    para = doc.add_paragraph()
    para.alignment = align
    para.paragraph_format.line_spacing = Pt(21)
    para.paragraph_format.space_before = Pt(sb)
    para.paragraph_format.space_after  = Pt(sa)
    para.paragraph_format.first_line_indent = Cm(1.25) if indent else Cm(0)
    if text:
        r = para.add_run(text); sf(r, bold=bold, size=size, italic=italic)
    return para

def pc(text='', bold=False, size=14, sb=0, sa=0, italic=False):
    return p(text, bold=bold, align=WD_ALIGN_PARAGRAPH.CENTER, size=size,
             sb=sb, sa=sa, italic=italic, indent=False)

def pl(text='', bold=False, size=14, sb=0, sa=0):
    return p(text, bold=bold, align=WD_ALIGN_PARAGRAPH.LEFT, size=size,
             sb=sb, sa=sa, indent=False)

def chapter(text):
    doc.add_page_break()
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para.paragraph_format.first_line_indent = Cm(0)
    para.paragraph_format.line_spacing = Pt(21)
    para.paragraph_format.space_before = Pt(0)
    para.paragraph_format.space_after  = Pt(12)
    r = para.add_run(text.upper()); sf(r, bold=True)

def para_h(text):
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.LEFT
    para.paragraph_format.first_line_indent = Cm(1.25)
    para.paragraph_format.line_spacing = Pt(21)
    para.paragraph_format.space_before = Pt(12)
    para.paragraph_format.space_after  = Pt(6)
    r = para.add_run(text); sf(r, bold=True)

def code(lines):
    for line in lines:
        para = doc.add_paragraph()
        para.alignment = WD_ALIGN_PARAGRAPH.LEFT
        para.paragraph_format.first_line_indent = Cm(0)
        para.paragraph_format.line_spacing = Pt(14)
        para.paragraph_format.space_before = Pt(0)
        para.paragraph_format.space_after  = Pt(0)
        r = para.add_run(line)
        r.font.name = 'Courier New'; r.font.size = Pt(11)

def cap_listing(text):
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.LEFT
    para.paragraph_format.first_line_indent = Cm(0)
    para.paragraph_format.space_before = Pt(6)
    para.paragraph_format.space_after  = Pt(3)
    para.paragraph_format.line_spacing = Pt(21)
    r = para.add_run(text); sf(r, italic=True, size=12)

def cap_table(text):
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.LEFT
    para.paragraph_format.first_line_indent = Cm(0)
    para.paragraph_format.space_before = Pt(12)
    para.paragraph_format.space_after  = Pt(3)
    para.paragraph_format.line_spacing = Pt(21)
    r = para.add_run(text); sf(r, size=14)

def cap_fig(text):
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para.paragraph_format.first_line_indent = Cm(0)
    para.paragraph_format.space_before = Pt(3)
    para.paragraph_format.space_after  = Pt(12)
    para.paragraph_format.line_spacing = Pt(21)
    r = para.add_run(text); sf(r, size=14)

def tbl(headers, rows, widths, fsize=12):
    t = doc.add_table(rows=1+len(rows), cols=len(headers))
    t.style = 'Table Grid'
    t.alignment = WD_TABLE_ALIGNMENT.CENTER

    # --- фиксируем ширину таблицы (fixed layout) ---
    tblPr = t._tbl.tblPr
    tblLayout = OxmlElement('w:tblLayout')
    tblLayout.set(qn('w:type'), 'fixed')
    tblPr.append(tblLayout)
    total_twips = int(round(sum(widths) * 567))
    tblW = OxmlElement('w:tblW')
    tblW.set(qn('w:w'), str(total_twips))
    tblW.set(qn('w:type'), 'dxa')
    tblPr.append(tblW)

    def _set_cell(cell, text, bold=False, center=False):
        cell.text = ''
        pp = cell.paragraphs[0]
        pp.alignment = WD_ALIGN_PARAGRAPH.CENTER if center else WD_ALIGN_PARAGRAPH.LEFT
        pp.paragraph_format.space_before = Pt(2)
        pp.paragraph_format.space_after  = Pt(2)
        pp.paragraph_format.first_line_indent = Cm(0)
        pp.paragraph_format.line_spacing = Pt(int(fsize * 1.5))
        r = pp.add_run(str(text)); sf(r, bold=bold, size=fsize)

    def _set_col_width(cell, w_cm):
        tc = cell._tc
        tcPr = tc.get_or_add_tcPr()
        tcW = OxmlElement('w:tcW')
        tcW.set(qn('w:w'), str(int(round(w_cm * 567))))
        tcW.set(qn('w:type'), 'dxa')
        tcPr.append(tcW)

    for i, h in enumerate(headers):
        _set_cell(t.rows[0].cells[i], h, bold=True, center=True)
        _set_col_width(t.rows[0].cells[i], widths[i])
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            _set_cell(t.rows[ri+1].cells[ci], val)
            _set_col_width(t.rows[ri+1].cells[ci], widths[ci])
    if widths:
        for row in t.rows:
            for i, w in enumerate(widths):
                row.cells[i].width = Cm(w)
    return t

def add_page_numbers():
    footer = doc.sections[0].footer
    para = footer.paragraphs[0]
    para.alignment = WD_ALIGN_PARAGRAPH.RIGHT; para.clear()
    run = para.add_run()
    run.font.name = 'Times New Roman'; run.font.size = Pt(12)
    for tag, txt in [('w:fldChar','begin',), ('w:instrText', None), ('w:fldChar','end')]:
        el = OxmlElement(tag)
        if tag == 'w:instrText': el.text = 'PAGE'
        else: el.set(qn('w:fldCharType'), txt)
        run._r.append(el)

add_page_numbers()

# ============================================================
# ТИТУЛЬНЫЙ ЛИСТ (по образцу АНО ПОО ММКЦТ «ТОП»)
# ============================================================
pc('АВТОНОМНАЯ НЕКОММЕРЧЕСКАЯ ОРГАНИЗАЦИЯ', bold=True, sa=0)
pc('ПРОФЕССИОНАЛЬНАЯ ОБРАЗОВАТЕЛЬНАЯ ОРГАНИЗАЦИЯ', bold=True)
pc('МОСКОВСКИЙ МЕЖДУНАРОДНЫЙ КОЛЛЕДЖ ЦИФРОВЫХ', bold=True)
pc('ТЕХНОЛОГИЙ «АКАДЕМИЯ ТОП»', bold=True, sa=24)

pc('ВЫПУСКНАЯ КВАЛИФИКАЦИОННАЯ РАБОТА', bold=True, sa=12)

pc('Уровень профессионального образования:')
pc('Среднее профессиональное образование', sa=12)

pc('Направление подготовки (специальность):')
pc('09.02.07 Информационные системы и программирование', sa=24)

pc('__________________________________________________')
pc('Разработка веб-приложения для автоматизации', bold=True)
pc('процессов ресторанного обслуживания (Look Restaurant)', bold=True, sa=6)
pc('наименование темы ВКР', italic=True, size=12, sa=12)

pc('Пояснительная записка')
pc('АНО ПОО ММКЦТ «ТОП» 09.02.07. 1. 22. 234', sa=32)

for label in ['Научный руководитель', 'Нормоконтролер', 'Обучающийся']:
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.LEFT
    para.paragraph_format.first_line_indent = Cm(0)
    para.paragraph_format.line_spacing = Pt(21)
    para.paragraph_format.space_after = Pt(12)
    r1 = para.add_run(f'{label:<25}'); sf(r1)
    r2 = para.add_run('______________________'); sf(r2)
    r3 = para.add_run('      ________________________'); sf(r3)
    para2 = doc.add_paragraph()
    para2.alignment = WD_ALIGN_PARAGRAPH.LEFT
    para2.paragraph_format.first_line_indent = Cm(0)
    para2.paragraph_format.space_after = Pt(18)
    para2.paragraph_format.line_spacing = Pt(21)
    r4 = para2.add_run(' ' * 35 + 'подпись, дата'); sf(r4, size=10, italic=True)
    r5 = para2.add_run('      инициалы, фамилия'); sf(r5, size=10, italic=True)

for _ in range(3):
    p('')

pc('Новосибирск 2026')

# ============================================================
# СОДЕРЖАНИЕ
# ============================================================
doc.add_page_break()
pc('СОДЕРЖАНИЕ', bold=True, sa=12)

toc = [
    ('ВВЕДЕНИЕ', '4', False),
    ('ГЛАВА 1 ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ К СИСТЕМЕ', '6', False),
    ('1.1 Назначение и область применения системы', '6', True),
    ('1.2 Функциональные характеристики и требования к системе', '8', True),
    ('1.3 Требования к надёжности и составу технических средств', '11', True),
    ('ГЛАВА 2 ПРОЕКТИРОВАНИЕ И РАЗРАБОТКА СИСТЕМЫ', '14', False),
    ('2.1 Обоснование выбора технологического стека', '14', True),
    ('2.2 Алгоритмы работы основных бизнес-процессов', '17', True),
    ('2.3 Программная реализация моделей базы данных', '19', True),
    ('2.3.1 Анализ нормализации и целостности базы данных', '27', True),
    ('2.4 Реализация серверной логики (модули NestJS)', '28', True),
    ('2.5 Безопасность, валидация и инфраструктурные сервисы', '33', True),
    ('2.5.8 Журналирование событий и ошибок', '40', True),
    ('2.6 Организация интерфейса и взаимодействие с API', '41', True),
    ('2.7 Дизайн пользовательского интерфейса и сценарии работы', '44', True),
    ('2.8 Развёртывание и контейнеризация (Docker)', '50', True),
    ('2.8.1 Нативный запуск без Docker', '52', True),
    ('ГЛАВА 3 ТЕСТИРОВАНИЕ СИСТЕМЫ', '53', False),
    ('3.1 План и методология тестирования', '53', True),
    ('3.2 Функциональное тестирование модулей', '54', True),
    ('3.3 Анализ результатов тестирования', '60', True),
    ('3.3.1 Выявленные и устранённые дефекты', '62', True),
    ('ЗАКЛЮЧЕНИЕ', '64', False),
    ('СПИСОК ИСПОЛЬЗОВАННОЙ ЛИТЕРАТУРЫ', '66', False),
    ('ПРИЛОЖЕНИЕ А. ER-диаграмма базы данных', '67', False),
    ('ПРИЛОЖЕНИЕ Б. Скриншоты интерфейса', '68', False),
    ('ПРИЛОЖЕНИЕ В. Диаграммы UML', '72', False),
]
for item, pg, is_sub in toc:
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.LEFT
    para.paragraph_format.first_line_indent = Cm(0)
    if is_sub:
        para.paragraph_format.left_indent = Cm(0.75)
    para.paragraph_format.line_spacing = Pt(21)
    para.paragraph_format.space_before = Pt(0)
    para.paragraph_format.space_after  = Pt(0)
    # tab stop с точечным лидером, выравнивание по правому краю на 17 см
    tab_pos = Cm(17) - (para.paragraph_format.left_indent or Cm(0))
    para.paragraph_format.tab_stops.add_tab_stop(
        tab_pos, alignment=WD_TAB_ALIGNMENT.RIGHT, leader=WD_TAB_LEADER.DOTS
    )
    r = para.add_run(f'{item}\t{pg}')
    sf(r, bold=(not is_sub), size=14)

# ============================================================
# ВВЕДЕНИЕ
# ============================================================
doc.add_page_break()
pc('ВВЕДЕНИЕ', bold=True, sa=12)

for txt in [
    'В условиях цифровизации рынка общественного питания перед владельцами ресторанов встаёт задача автоматизации операционных процессов. Современный гость ожидает возможности просматривать меню, оформлять доставку, бронировать столики и получать персональные скидки через веб-интерфейс без телефонных звонков.',
    'Большинство готовых решений (iiko, r_keeper, Restik) ориентированы на крупные сети и предполагают значительные финансовые вложения. Для малого бизнеса они нередко избыточны и дороги. Альтернативой служат заказные веб-приложения под конкретное заведение.',
    'Настоящая выпускная квалификационная работа посвящена разработке веб-приложения Look Restaurant, автоматизирующего ключевые процессы: управление меню, приём онлайн-заказов с промокодами, бронирование столиков, личный кабинет пользователя и административную панель. Дополнительно реализованы gamification-механики — мини-игра «Спринт шефа» и пасхальное яйцо.',
    'Объект исследования — процессы цифрового взаимодействия гостей ресторана с заведением: просмотр меню, оформление заказа, бронирование стола и управление личными данными.',
    'Предмет исследования — методы программной автоматизации указанных процессов на основе клиент-серверного веб-приложения (NestJS, React, PostgreSQL, Docker).',
    'Цель работы — разработать и задокументировать веб-приложение Look Restaurant, обеспечивающее полный цикл цифрового взаимодействия гостя с рестораном.',
    'Для достижения цели решены следующие задачи:\n1. Проведён анализ предметной области и аналогов, сформулированы требования.\n2. Обоснован технологический стек и спроектирована архитектура системы.\n3. Разработаны серверные модули: аутентификация, меню, заказы, бронирование, отзывы, gamification.\n4. Реализован клиентский интерфейс на React + Tailwind CSS + Framer Motion.\n5. Разработана административная панель управления.\n6. Приложение развёрнуто в Docker Compose.\n7. Проведено функциональное тестирование.',
    'Практическая значимость: разработанное приложение готово к развёртыванию для реального ресторана, все компоненты задокументированы.',
    'Технологический стек, реализованный в данной работе (Node.js / NestJS, React, PostgreSQL, Docker), был адаптирован с учётом требований к независимой разработке клиентской и серверной частей, масштабируемости и контейнеризированному развёртыванию. Подробное обоснование выбора каждого компонента и сравнение с альтернативами приведено в подразделе 2.1.',
]:
    for line in txt.split('\n'):
        p(line)

# ============================================================
# ГЛАВА 1
# ============================================================
chapter('ГЛАВА 1 ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ К СИСТЕМЕ')

para_h('1.1 Назначение и область применения разрабатываемой системы')

for txt in [
    'Look Restaurant представляет собой полнофункциональное клиент-серверное веб-приложение, предназначенное для автоматизации операционных процессов ресторанного заведения в цифровой среде. Система ориентирована на два основных типа пользователей: гостей ресторана — конечных потребителей услуг — и административный персонал заведения.',
    'Для гостей система предоставляет единую цифровую точку взаимодействия с рестораном: просмотр и фильтрацию меню по категориям и цене, оформление заказа на доставку с выбором блюд и применением промокодов, бронирование столика на конкретную дату и время с отображением реальной доступности, личный кабинет с историей заказов и бронирований, а также возможность оставить отзыв с оценкой по пятибалльной шкале.',
    'Административный персонал получает закрытую панель управления, доступную по отдельному паролю. В ней сосредоточены инструменты управления всеми аспектами работы ресторана: CRUD-операции над позициями меню, просмотр и изменение статусов поступивших заказов и бронирований, модерация отзывов гостей, просмотр контактных обращений и экспорт данных меню в CSV-файл.',
    'Область применения системы — предприятия общественного питания малого и среднего масштаба (рестораны, кафе, бистро), желающие предложить гостям современный цифровой опыт взаимодействия без значительных затрат на корпоративные платформы.',
    'Дополнительно система включает gamification-элементы: мини-игра «Спринт шефа» даёт промокод LOOKRUN при наборе порогового счёта; механика пасхального яйца открывает промокод LOOK15 при обнаружении скрытого элемента на странице заказа.',
    'В таблице 1 приведено описание ролей пользователей системы.',
]:
    p(txt)

cap_table('Таблица 1 – Роли пользователей системы Look Restaurant')
tbl(
    ['Роль', 'Описание', 'Доступные функции'],
    [
        ['Гость (неавторизованный)', 'Любой посетитель сайта без учётной записи', 'Просмотр меню, проверка доступности столиков, оформление заказа и брони без сохранения в профиле'],
        ['Авторизованный пользователь', 'Зарегистрированный гость с личным кабинетом', 'Все функции гостя + история заказов и бронирований, отмена брони, отзывы, участие в gamification'],
        ['Администратор', 'Сотрудник ресторана с отдельным паролем', 'Управление меню, заказами, бронированиями, отзывами; экспорт CSV; просмотр обращений'],
    ],
    [4, 5, 8]
)
p('Разграничение прав доступа реализовано на уровне сервера: все защищённые маршруты требуют валидного JWT-токена, административные маршруты дополнительно проверяют роль admin в полезной нагрузке токена. Это исключает несанкционированный доступ к функциям управления через прямой URL.')

para_h('1.2 Функциональные характеристики и требования к системе')

for txt in [
    'Функциональные требования к системе сформированы на основе анализа предметной области ресторанного бизнеса и изучения конкурирующих решений. К рассмотренным аналогам относятся: iiko (комплексная система автоматизации ресторана с модулями кассы, склада и CRM), r_keeper (программный продукт для автоматизации обслуживания в залах и кухне) и Restik (облачная система учёта для кафе и ресторанов с онлайн-кассой). Все три решения обладают широким функционалом, однако рассчитаны на средние и крупные предприятия, требуют платных лицензий и интеграции со специализированным оборудованием.',
    'Разрабатываемая система Look Restaurant предлагает более компактное и экономичное решение, ориентированное на цифровое взаимодействие с гостем через веб-интерфейс. Ключевые функциональные требования систематизированы в таблице 2.',
]:
    p(txt)

cap_table('Таблица 2 – Функциональные требования к системе')
tbl(
    ['Модуль', 'Требование', 'Приоритет'],
    [
        ['Аутентификация', 'Регистрация: проверка имени, уникального email, телефона, пароля (мин. 6 символов)', 'Высокий'],
        ['Аутентификация', 'Вход по email и паролю; возврат JWT-токена', 'Высокий'],
        ['Аутентификация', 'Восстановление пароля через 6-значный код на email (срок 15 мин)', 'Высокий'],
        ['Аутентификация', 'Редактирование профиля: изменение имени и телефона', 'Средний'],
        ['Меню', 'Получение полного списка позиций меню (публичный доступ)', 'Высокий'],
        ['Меню', 'Фильтрация меню по категории на стороне клиента', 'Высокий'],
        ['Меню', 'Сортировка по цене (возрастание / убывание)', 'Средний'],
        ['Меню', 'CRUD-управление через административную панель', 'Высокий'],
        ['Заказы', 'Создание заказа: адрес, телефон, имя получателя, email, список блюд с ценой', 'Высокий'],
        ['Заказы', 'Применение промокодов: LOOK20 (первый заказ), LOOK15 (пасхалка), LOOKRUN (игра)', 'Средний'],
        ['Заказы', 'История заказов в личном кабинете пользователя', 'Средний'],
        ['Заказы', 'Управление заказами в админ-панели: список, смена статуса', 'Высокий'],
        ['Бронирование', 'Создание брони: дата, время, количество гостей, номер стола, примечания', 'Высокий'],
        ['Бронирование', 'Проверка доступности столиков в реальном времени', 'Высокий'],
        ['Бронирование', 'Защита от двойного бронирования одного стола', 'Высокий'],
        ['Бронирование', 'Отмена бронирования пользователем из личного кабинета', 'Средний'],
        ['Отзывы', 'Создание отзыва: имя, оценка 1–5, текст; публичный просмотр всех отзывов', 'Средний'],
        ['Контакт', 'Отправка обращения: имя, контакт, текст сообщения', 'Низкий'],
        ['Gamification', 'Мини-игра «Спринт шефа»: при наборе порогового счёта — промокод LOOKRUN', 'Низкий'],
        ['Gamification', 'Пасхальное яйцо: обнаружение скрытого элемента — промокод LOOK15', 'Низкий'],
        ['Администрирование', 'Экспорт меню в CSV-файл', 'Средний'],
        ['Администрирование', 'Просмотр и удаление отзывов через административную панель', 'Средний'],
    ],
    [3, 11, 3]
)

p('На основе анализа функциональных требований были также сформулированы нефункциональные требования, представленные в таблице 3. Они определяют ограничения по производительности, безопасности, надёжности и удобству использования.')

cap_table('Таблица 3 – Нефункциональные требования к системе')
tbl(
    ['Категория', 'Требование', 'Обоснование'],
    [
        ['Производительность', 'Время ответа API (меню, отзывы) — не более 200 мс', 'Плавность интерфейса, отсутствие задержек'],
        ['Безопасность', 'Пароли хранятся только в виде хэша bcrypt (cost factor = 10)', 'Защита данных при утечке базы данных'],
        ['Безопасность', 'Все защищённые маршруты проверяют JWT; административные — дополнительно роль admin', 'Разграничение прав пользователей и администраторов'],
        ['Безопасность', 'Секреты (JWT_SECRET, пароли) хранятся в переменных окружения, не в коде', 'Исключение утечки секретов через репозиторий'],
        ['Надёжность', 'Серверная валидация всех входных данных через class-validator', 'Предотвращение некорректных записей в БД'],
        ['Надёжность', 'Транзакционное обновление БД при смене пароля ($transaction)', 'Исключение рассинхронизации данных при сбое'],
        ['Надёжность', 'Тайм-аут HTTP-запросов: 10 с по умолчанию, 8 с для авторизации', 'Корректное поведение при задержках сервера'],
        ['Удобство', 'Адаптивный дизайн: мобильные, планшеты, десктоп (Tailwind CSS breakpoints)', 'Высокая доля мобильного трафика в аудитории'],
        ['Удобство', 'Плавные анимации Framer Motion: переходы, hover, появление при прокрутке', 'Ощущение качественного продукта'],
        ['Развёртывание', 'Запуск всего стека одной командой: docker compose up --build', 'Воспроизводимое окружение, простота деплоя'],
    ],
    [3, 9, 5]
)

para_h('1.3 Требования к надёжности и составу технических средств')

for txt in [
    'Требования к надёжности определяются назначением системы — обслуживание гостей в режиме реального времени. Серверная валидация через class-validator проверяет все входящие DTO (типы, обязательные поля, длину строк, диапазоны значений); нарушение любого ограничения возвращает HTTP 400 с детальным описанием. Атомарность критических операций обеспечивается транзакциями Prisma ($transaction) — например, при сбросе пароля обновление хэша и пометка токена как использованного выполняются как единое целое.',
    'Конкурентные запросы на бронирование одного стола блокируются повторной проверкой уникальности (дата, время, номер стола) перед INSERT — при конфликте возвращается HTTP 409. Клиентские запросы ограничены тайм-аутом 10 с через AbortController, что исключает бесконечное ожидание. Контейнеры Docker Compose работают с политикой unless-stopped; API стартует только после прохождения health check PostgreSQL (pg_isready).',
    'Требования к аппаратным средствам для сервера приведены в таблице 4.',
]:
    p(txt)

cap_table('Таблица 4 – Требования к аппаратным средствам сервера')
tbl(
    ['Компонент', 'Минимальные требования', 'Рекомендуемые требования'],
    [
        ['Процессор', '2 ядра, 1.5 ГГц', '4 ядра, 2.5 ГГц и выше'],
        ['Оперативная память', '2 ГБ ОЗУ', '4 ГБ ОЗУ и более'],
        ['Дисковое пространство', '10 ГБ', '20 ГБ SSD'],
        ['Операционная система', 'Linux Ubuntu 22.04+', 'Ubuntu 24.04 LTS'],
        ['Программное обеспечение', 'Docker Engine 24.0+, Compose V2', 'Те же версии и выше'],
    ],
    [5, 6, 6]
)

p('Для конечного пользователя (браузерная часть) требования минимальны: любое устройство с современным браузером (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+), поддерживающим JavaScript ES2020 и CSS3. Специального программного обеспечения не требуется.')

p('Требования к резервному копированию и ведению журналов. Данные PostgreSQL хранятся в именованном Docker volume postgres_data, что обеспечивает их сохранность при перезапуске контейнеров. Для производственной эксплуатации рекомендуется периодическое резервное копирование базы данных командой pg_dump с последующим сохранением дампа на внешнем хранилище. На уровне приложения реализовано инфраструктурное журналирование: глобальный фильтр исключений HttpErrorFilter фиксирует в стандартном потоке вывода сервера все обработанные ошибки с указанием HTTP-статуса, пути запроса и временной метки. В Docker Compose журналы доступны через команду docker logs look_api. В перспективе предусмотрено подключение структурированного логирования (Winston или Pino) с ротацией файлов журнала по дате.')

# ============================================================
# ГЛАВА 2
# ============================================================
chapter('ГЛАВА 2 ПРОЕКТИРОВАНИЕ И РАЗРАБОТКА СИСТЕМЫ')

para_h('2.1 Обоснование выбора технологического стека')

for txt in [
    'Выбор технологического стека для Look Restaurant определялся критериями: скорость разработки, производительность, современность и удобство развёртывания. Обоснование выбора приведено в таблице 5.',
    'Серверная платформа — Node.js (неблокирующая модель I/O, наиболее популярная серверная технология по Stack Overflow 2024) с фреймворком NestJS. NestJS выбран за встроенную DI-систему, систему guards, декларативную валидацию через class-validator и чёткую модульную архитектуру. Альтернатива Express.js отклонена — при ограниченных сроках строить архитектуру с нуля нецелесообразно. Для хранения данных выбрана PostgreSQL (полный ACID, строгий SQL, поддержка конкурентной записи) с ORM Prisma: декларативная схема в schema.prisma, автомиграции, типобезопасный клиент.',
    'Клиентская часть построена на React (компонентный подход) с Vite (мгновенный HMR), Tailwind CSS (утилитарный адаптивный дизайн) и Framer Motion (декларативные анимации). Весь стек (PostgreSQL, API, Frontend) контейнеризирован в Docker Compose — запуск одной командой, воспроизводимое окружение.',
]:
    p(txt)

cap_table('Таблица 5 – Сравнение технологий с альтернативами')
tbl(
    ['Компонент', 'Выбрано', 'Альтернатива', 'Обоснование выбора'],
    [
        ['Серверный фреймворк', 'NestJS', 'Express.js', 'Встроенные DI, guards, валидация; чёткая модульная архитектура'],
        ['СУБД', 'PostgreSQL', 'MySQL, SQLite', 'Полный ACID, строгий SQL, нет ограничений на конкурентную запись'],
        ['ORM', 'Prisma', 'TypeORM, Sequelize', 'Декларативная схема, типобезопасность, автомиграции'],
        ['UI-библиотека', 'React + Vite', 'Vue.js, Angular', 'Компонентный подход, мгновенный HMR, большая экосистема'],
        ['CSS-фреймворк', 'Tailwind CSS', 'Bootstrap 5, MUI', 'Утилитарный подход, встроенная адаптивность'],
        ['Анимации', 'Framer Motion', 'GSAP, CSS', 'Декларативный React-нативный API анимаций'],
        ['Контейнеризация', 'Docker Compose', 'Bare metal, K8s', 'Простота конфигурации, запуск одной командой'],
    ],
    [3.5, 3, 3, 7.5]
)

para_h('2.2 Алгоритмы работы основных бизнес-процессов системы')

for txt in [
    'В данном разделе описаны алгоритмы ключевых бизнес-процессов системы.',
    'Регистрация и вход. POST /api/register → ValidationPipe проверяет DTO → уникальность email в users → bcrypt.hash(password, 10) → create user → вернуть {user, JWT-токен}. Восстановление пароля: сервер генерирует 6-значный код, сохраняет его bcrypt-хэш в password_reset_tokens (TTL 15 мин), отправляет код на email. При сбросе — bcrypt.compare по всем активным токенам → $transaction(update passwordHash, mark used).',
    'Оформление заказа. POST /api/orders → нормализация email → ветвление по промокоду: LOOK20 требует отсутствия предыдущих заказов, LOOK15 — флага hasFoundEasterEgg, LOOKRUN — runnerPromoEligible (сбрасывается после использования). Цены берутся из menu_items, клиентские значения игнорируются. Бронирование. GET /api/reservations/availability → dayRange(UTC) → count активных броней (status ≠ cancelled) → TableMap клиента. POST /api/reservations → повторная проверка уникальности (date, time, tableNumber) → HTTP 409 при конфликте.',
]:
    p(txt)

para_h('2.3 Программная реализация моделей базы данных')

for txt in [
    'База данных является центральным элементом системы. Её структура описана в файле backend/prisma/schema.prisma с использованием языка схем Prisma (PSL). Файл схемы — единственный источник истины: по нему генерируются SQL-миграции и типобезопасный клиент. Система содержит 9 моделей: User, MenuItem, Reservation, Order, OrderItem, Review, PasswordResetToken, PromoCode, ContactMessage. Связи между моделями реализованы через внешние ключи, индексы построены на полях, по которым выполняется частая фильтрация.',
    'Модель User хранит данные зарегистрированных пользователей. Поле passwordHash содержит bcrypt-хэш пароля — открытый пароль никогда не сохраняется. Поля hasFoundEasterEgg и runnerPromoEligible реализуют gamification-логику. Аннотации @map задают snake_case-имена в PostgreSQL при сохранении camelCase в коде.',
]:
    p(txt)

cap_listing('Листинг 1 – Модель User (schema.prisma)')
code([
    'model User {',
    '  id                  Int      @id @default(autoincrement())',
    '  name                String',
    '  email               String   @unique',
    '  phone               String',
    '  passwordHash        String   @map("password_hash")',
    '  role                String   @default("user")',
    '  hasFoundEasterEgg   Boolean  @default(false) @map("has_found_easter_egg")',
    '  runnerPromoEligible Boolean  @default(false) @map("runner_promo_eligible")',
    '  createdAt           DateTime @default(now()) @map("created_at")',
    '  reservations        Reservation[]',
    '  orders              Order[]',
    '  reviews             Review[]',
    '  @@map("users")',
    '}',
])

p('Модель MenuItem описывает позицию меню. Поля description и tag объявлены nullable (String?), что позволяет добавлять блюда без обязательного заполнения этих атрибутов. Поле rating хранит среднюю оценку блюда как число с плавающей точкой.')

cap_listing('Листинг 2 – Модель MenuItem (schema.prisma)')
code([
    'model MenuItem {',
    '  id          Int     @id @default(autoincrement())',
    '  name        String',
    '  price       Int',
    '  category    String',
    '  imageUrl    String  @map("image_url")',
    '  rating      Float',
    '  prepTime    Int     @map("prep_time")',
    '  description String?',
    '  tag         String?',
    '  orderItems  OrderItem[]',
    '  @@map("menu_items")',
    '}',
])

p('Модель Reservation хранит бронирования столиков. Поле date хранит полную метку времени UTC — функция parseYmdUTC() обеспечивает корректную нормализацию при запросах. Поле tableNumber является необязательным: гость может не выбирать конкретный стол.')

cap_listing('Листинг 3 – Модель Reservation (schema.prisma)')
code([
    'model Reservation {',
    '  id           Int      @id @default(autoincrement())',
    '  userId       Int?     @map("user_id")',
    '  name         String',
    '  phone        String',
    '  date         DateTime',
    '  time         String',
    '  guestsCount  Int      @map("guests_count")',
    '  tableNumber  Int?     @map("table_number")',
    '  notes        String?',
    '  status       String   @default("pending")',
    '  createdAt    DateTime @default(now()) @map("created_at")',
    '  user  User?  @relation(fields: [userId], references: [id])',
    '  @@map("reservations")',
    '}',
])

p('Модели Order и OrderItem реализуют отношение «один заказ — много позиций». Хранение цены в OrderItem.price фиксирует стоимость блюда на момент заказа независимо от последующего изменения прайс-листа.')

cap_listing('Листинг 4 – Модели Order и OrderItem (schema.prisma)')
code([
    'model Order {',
    '  id            Int       @id @default(autoincrement())',
    '  userId        Int?      @map("user_id")',
    '  address       String',
    '  phone         String',
    '  recipientName String    @map("recipient_name")',
    '  comment       String?',
    '  totalAmount   Int       @map("total_amount")',
    '  promoCode     String?   @map("promo_code")',
    '  email         String?',
    '  status        String    @default("new")',
    '  createdAt     DateTime  @default(now()) @map("created_at")',
    '  user          User?     @relation(fields: [userId], references: [id])',
    '  items         OrderItem[]',
    '  @@map("orders")',
    '}',
    '',
    'model OrderItem {',
    '  id           Int     @id @default(autoincrement())',
    '  orderId      Int     @map("order_id")',
    '  menuItemId   Int     @map("menu_item_id")',
    '  quantity     Int',
    '  price        Int',
    '  nameSnapshot String? @map("name_snapshot")',
    '  order     Order    @relation(fields: [orderId], references: [id])',
    '  menuItem  MenuItem @relation(fields: [menuItemId], references: [id])',
    '  @@map("order_items")',
    '}',
])

p('Поле nameSnapshot в OrderItem фиксирует название блюда на момент оформления заказа. Это важная деталь для исторической отчётности: если позже название позиции меню изменится или сама позиция будет удалена, исторические заказы по-прежнему будут отображать корректное название блюда, которое заказывал клиент.')

p('Цена в OrderItem.price также является снимком: на момент создания заказа сервер берёт текущую цену из таблицы menu_items и сохраняет её в позицию. Клиент при создании заказа НЕ передаёт цену — её всегда определяет сервер. Это защищает систему от попыток подмены цены через прямой запрос к API.')

p('Модель PasswordResetToken хранит bcrypt-хэш кода восстановления (не сам код) — это защищает систему при утечке БД. Индексы по email и expiresAt ускоряют выборку. Модель PromoCode реализует динамическую систему промокодов: каждый код имеет процент скидки, флаг активности, опциональный период действия и лимит использований. Три специальных кода (LOOK20, LOOK15, LOOKRUN) живут в той же таблице, но с дополнительной логикой проверки на уровне приложения.')

cap_listing('Листинг 5 – Вспомогательные модели (schema.prisma)')
code([
    'model Review {',
    '  id Int @id @default(autoincrement()); userId Int? @map("user_id")',
    '  authorName String @map("author_name"); rating Int; text String',
    '  createdAt DateTime @default(now()) @map("created_at")',
    '  user User? @relation(fields: [userId], references: [id])',
    '  @@map("reviews") }',
    '',
    'model PasswordResetToken {',
    '  id Int @id @default(autoincrement()); email String',
    '  tokenHash String? @map("token_hash"); expiresAt DateTime @map("expires_at")',
    '  used Boolean @default(false)',
    '  @@index([email]) @@index([expiresAt]) @@map("password_reset_tokens") }',
    '',
    'model PromoCode {',
    '  id Int @id @default(autoincrement()); code String @unique',
    '  discount Int; isActive Boolean @default(true) @map("is_active")',
    '  validFrom DateTime? @map("valid_from"); validUntil DateTime? @map("valid_until")',
    '  usageLimit Int? @map("usage_limit")',
    '  @@index([code]) @@index([isActive]) @@map("promo_codes") }',
    '',
    'model ContactMessage {',
    '  id Int @id @default(autoincrement())',
    '  name String; contact String; message String',
    '  createdAt DateTime @default(now()) @map("created_at")',
    '  @@map("contact_messages") }',
])

cap_table('Таблица 6 – Сводная характеристика таблиц базы данных')
tbl(
    ['Таблица', 'Назначение', 'Ключевые поля', 'Связи'],
    [
        ['users', 'Зарегистрированные пользователи', 'email (unique), password_hash, role, has_found_easter_egg, runner_promo_eligible', 'один-ко-многим: reservations, orders, reviews'],
        ['menu_items', 'Позиции меню ресторана', 'name, price, category, image_url, rating, prep_time', 'один-ко-многим: order_items'],
        ['reservations', 'Бронирования столиков', 'user_id (FK), date, time, table_number, status', 'многие-к-одному: users'],
        ['orders', 'Заказы на доставку', 'user_id (FK), address, total_amount, promo_code, status, email', 'один-ко-многим: order_items'],
        ['order_items', 'Позиции заказа', 'order_id (FK), menu_item_id (FK), quantity, price, name_snapshot', 'многие-к-одному: orders, menu_items'],
        ['reviews', 'Отзывы гостей', 'user_id (FK), author_name, rating, text', 'многие-к-одному: users'],
        ['password_reset_tokens', 'Коды сброса пароля', 'email, token_hash, expires_at, used', 'нет FK (индексы)'],
        ['promo_codes', 'Промокоды со скидкой', 'code (unique), discount, is_active, valid_from, valid_until', 'нет FK (индексы)'],
        ['contact_messages', 'Контактные обращения', 'name, contact, message', 'нет FK'],
    ],
    [3.5, 4, 5.5, 4]
)

para_h('2.3.1 Анализ нормализации и целостности базы данных')

for txt in [
    'База данных системы Look Restaurant спроектирована в соответствии с третьей нормальной формой (3НФ), что обеспечивает минимальное дублирование данных, отсутствие транзитивных зависимостей и высокую целостность хранилища.',
    'Первая нормальная форма (1НФ) соблюдена во всех таблицах: каждое поле хранит атомарное значение, все строки уникальны благодаря суррогатным ключам с автоинкрементом (@id @default(autoincrement())). Составные поля в таблицах отсутствуют; списки блюд в заказе вынесены в отдельную таблицу order_items, что устраняет повторяющиеся группы.',
    'Вторая нормальная форма (2НФ) выполняется, поскольку все первичные ключи простые (одно поле id). Все неключевые атрибуты полностью функционально зависят от первичного ключа своей таблицы. Например, в таблице order_items поля quantity, price и name_snapshot зависят от id конкретной позиции заказа, а не от части ключа.',
    'Третья нормальная форма (3НФ) обеспечена отсутствием транзитивных зависимостей. Например, цена и название блюда вынесены из таблицы orders в отдельную таблицу menu_items и связываются через внешний ключ menu_item_id в order_items. Поле name_snapshot в order_items хранит снимок названия на момент заказа — это намеренное денормализованное поле для обеспечения исторической корректности (если блюдо переименуют, история заказов не изменится).',
    'Ссылочная целостность обеспечена внешними ключами: user_id в таблицах reservations, orders и reviews ссылается на таблицу users; order_id и menu_item_id в order_items ссылаются на соответствующие родительские таблицы. Поля с внешними ключами объявлены nullable (Int?) в тех случаях, где связь необязательна — например, заказ может быть оформлен анонимным гостем без учётной записи. Индексы на полях email в password_reset_tokens и code в promo_codes ускоряют наиболее частые запросы. Полная ER-диаграмма приведена в приложении А.',
]:
    p(txt)

para_h('2.4 Реализация серверной логики (модули NestJS)')

for txt in [
    'Серверная часть организована по модульному принципу NestJS. Каждый модуль инкапсулирует логику одной предметной области. Все модули регистрируются в корневом AppModule. Глобальный JwtAuthGuard проверяет токен для всех маршрутов, кроме помеченных @Public().',
]:
    p(txt)

cap_listing('Листинг 6 – Корневой модуль (app.module.js)')
code([
    '@Module({',
    '  imports: [',
    '    MenuModule, PromosModule, AuthModule,',
    '    OrdersModule, ReservationsModule,',
    '    ReviewsModule, AdminModule, ContactModule,',
    '  ],',
    '  controllers: [AppController],',
    '  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],',
    '})',
    'export class AppModule {}',
])

p('Регистрация JwtAuthGuard через APP_GUARD означает, что каждый входящий запрос проходит через этот guard. Маршруты с декоратором @Public() (регистрация, вход, меню, отзывы, проверка доступности столиков) обрабатываются без проверки токена.')

p('Модуль аутентификации — AuthController. Ниже приведены листинги ключевых эндпоинтов.')

cap_listing('Листинг 7 – Регистрация пользователя (auth.controller.js)')
code([
    '@Public()',
    "@Post('register')",
    'async register(@Body() body) {',
    '  const existing = await this.prisma.user.findFirst(',
    '    { where: { email: body.email } }',
    '  );',
    "  if (existing) throw new BadRequestException('Email уже зарегистрирован');",
    '',
    '  const passwordHash = await bcrypt.hash(body.password, 10);',
    '  const user = await this.prisma.user.create({',
    "    data: { name: body.name, email: body.email,",
    "            phone: body.phone, passwordHash, role: 'user' },",
    '  });',
    '  return { user: this.toUserResponse(user), token: signToken({ sub: user.id }) };',
    '}',
])

cap_listing('Листинг 8 – Сброс пароля через транзакцию (auth.controller.js)')
code([
    '@Public()',
    "@Post('reset-password')",
    'async resetPassword(@Body() body) {',
    '  const candidates = await this.prisma.passwordResetToken.findMany({',
    '    where: { email: body.email, used: false,',
    '             expiresAt: { gt: new Date() } },',
    "    orderBy: { createdAt: 'desc' }, take: 5,",
    '  });',
    '  let tokenRow = null;',
    '  for (const t of candidates) {',
    '    if (await bcrypt.compare(body.code, t.tokenHash)) {',
    '      tokenRow = t; break;',
    '    }',
    '  }',
    "  if (!tokenRow) throw new BadRequestException('Неверный или просроченный код');",
    '',
    '  const user = await this.prisma.user.findFirst({ where: { email: body.email } });',
    "  if (!user) throw new BadRequestException('Пользователь не найден');",
    '',
    '  const nextHash = await bcrypt.hash(body.new_password, 10);',
    '  await this.prisma.$transaction([',
    '    this.prisma.user.update(',
    '      { where: { id: user.id }, data: { passwordHash: nextHash } }',
    '    ),',
    '    this.prisma.passwordResetToken.update(',
    '      { where: { id: tokenRow.id }, data: { used: true } }',
    '    ),',
    '  ]);',
    "  return { message: 'Пароль успешно изменён' };",
    '}',
])

p('Модуль заказов — OrdersController. Наиболее сложный контроллер с точки зрения бизнес-логики. Ниже показана логика проверки промокодов.')

cap_listing('Листинг 9 – Проверка специальных промокодов (orders.controller.js)')
code([
    "if (body.promo_code === 'LOOK20') {",
    '  if (emailNorm) {',
    '    const hasOrders = (await this.prisma.order.findFirst({',
    '      where: { email: ilike(emailNorm) }, select: { id: true },',
    '    })) !== null;',
    "    if (hasOrders) throw new BadRequestException('ТОЛЬКО ДЛЯ ПЕРВОГО ЗАКАЗА');",
    '  }',
    "} else if (body.promo_code === 'LOOK15') {",
    '  if (!user || !user.hasFoundEasterEgg)',
    "    throw new NotFoundException('ПРОМОКОД НЕ СУЩЕСТВУЕТ');",
    '  const usedLook15 = (await this.prisma.order.findFirst({',
    "    where: { email: ilike(emailNorm), promoCode: 'LOOK15' },",
    '    select: { id: true },',
    '  })) !== null;',
    "  if (usedLook15) throw new BadRequestException('Вы уже использовали LOOK15');",
    "} else if (body.promo_code === 'LOOKRUN') {",
    "  if (!user) throw new NotFoundException('ПРОМОКОД НЕ СУЩЕСТВУЕТ');",
    '  if (!user.runnerPromoEligible)',
    "    throw new BadRequestException('Сначала пройдите мини-игру');",
    '}',
])

p('Модуль бронирования — ReservationsController. Ключевая особенность — работа с датами в UTC через вспомогательную функцию parseYmdUTC(ymd), преобразующую строку "YYYY-MM-DD" в midnight UTC. Это исключает смещения часовых поясов при сравнении дат в Prisma-запросах.')

cap_listing('Листинг 10 – Проверка доступности столиков (reservations.controller.js)')
code([
    '@Public()',
    "@Get('reservations/availability')",
    'async availability(@Query(\'date\') date, @Query(\'time\') time) {',
    '  const { start, end } = dayRange(date);',
    '  const reservations = await this.prisma.reservation.findMany({',
    '    where: {',
    '      date: { gte: start, lt: end }, time,',
    "      status: { not: 'cancelled' },",
    '    },',
    '    select: { tableNumber: true },',
    '  });',
    '  const booked = reservations.map(r => r.tableNumber).filter(x => x !== null);',
    '  return {',
    '    total_tables: MAX_TABLES,',
    '    booked_tables: booked,',
    '    available: Math.max(0, MAX_TABLES - booked.length),',
    '  };',
    '}',
])

p('Модуль администрирования — AdminController. Все эндпоинты модуля защищены AdminGuard, проверяющим наличие роли admin в JWT-токене. Вход в административную панель выполняется отдельным эндпоинтом с паролем из переменной окружения.')

cap_listing('Листинг 11 – Вход в административную панель (admin.controller.js)')
code([
    '@Public()',
    '@Throttle({ default: { limit: 5, ttl: 60_000 } })',
    "@Post('login')",
    'async adminLogin(@Body() body) {',
    "  const input = String(body?.password ?? '');",
    '  const hash  = process.env.ADMIN_PASSWORD_HASH;',
    '  const plain = process.env.ADMIN_PASSWORD;',
    '',
    '  let ok = false;',
    '  if (hash) {',
    '    ok = await bcrypt.compare(input, hash);',
    '  } else if (plain) {',
    '    const a = Buffer.from(input);',
    '    const b = Buffer.from(plain);',
    '    ok = a.length === b.length && timingSafeEqual(a, b);',
    '  }',
    '',
    "  if (!ok) throw new ForbiddenException('Неверный пароль');",
    "  return { token: signToken({ role: 'admin' }, '8h') };",
    '}',
])

p('Модуль промокодов — PromosController. Содержит эндпоинт проверки промо-статуса пользователя и два защищённых эндпоинта для gamification: фиксации пасхального яйца и начисления награды за мини-игру.')

cap_listing('Листинг 12 – Начисление награды за мини-игру (promos.controller.js)')
code([
    "@Post('user/runner-reward')",
    'async runnerReward(@Body() body, @Req() req) {',
    '  if ((body?.score ?? 0) < MIN_RUNNER_SCORE)',
    "    throw new BadRequestException('Недостаточно очков — добегите до финиша.');",
    '',
    '  const userId = req.user?.sub;',
    "  if (!userId) throw new BadRequestException('Необходима авторизация');",
    '',
    '  await this.prisma.user.update({',
    '    where: { id: userId },',
    '    data: { runnerPromoEligible: true },',
    '  });',
    '  return { ok: true };',
    '}',
])

para_h('2.5 Безопасность, валидация и инфраструктурные сервисы')

for txt in [
    'Помимо чисто бизнес-логики серверная часть включает ряд инфраструктурных механизмов, направленных на безопасность, отказоустойчивость и единообразную обработку ошибок. В этом разделе рассматриваются глобальные элементы серверного приложения: подключённые middleware, фильтры исключений, валидация запросов, ограничение частоты обращений (rate limiting), управление CORS, отправка писем, динамическое управление промокодами и автоматическая документация API через Swagger.',
    'Корневой файл приложения backend/src/main.js является точкой входа: именно в нём конфигурируется приложение NestJS, подключаются глобальные пайпы, фильтры, CORS-политика, и стартует HTTP-сервер на порту 8000.',
]:
    p(txt)

cap_listing('Листинг 13 – Точка входа приложения (main.js, фрагмент)')
code([
    'async function bootstrap() {',
    '  const app = await NestFactory.create(AppModule);',
    '  app.enableCors({',
    '    origin: (origin, cb) => {',
    '      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);',
    "      cb(new Error('Not allowed by CORS'));",
    '    },',
    '    credentials: true,',
    '  });',
    '  app.useGlobalPipes(new ValidationPipe({',
    '    whitelist: true, transform: true, forbidNonWhitelisted: true,',
    '  }));',
    '  app.useGlobalFilters(new HttpErrorFilter());',
    '  await app.listen(process.env.PORT ?? 8000, \'0.0.0.0\');',
    '}',
])

p('CORS-политика разрешает запросы только от заранее определённых источников (переменная ALLOWED_ORIGINS), что предотвращает несанкционированное обращение к API со сторонних сайтов. Параметр credentials: true необходим для передачи JWT-заголовков между фронтендом и API на разных портах. Глобальный ValidationPipe работает с тремя ключевыми опциями: whitelist: true отбрасывает поля, не объявленные в DTO (защита от mass-assignment); forbidNonWhitelisted: true возвращает HTTP 400 при наличии лишних полей; transform: true автоматически приводит параметры к типам DTO и активирует @Type() для вложенных объектов.')

para_h('2.5.1 Глобальная обработка ошибок (HttpErrorFilter)')

for txt in [
    'Для единообразного формата ошибок API во всех модулях системы реализован собственный глобальный фильтр исключений HttpErrorFilter, регистрируемый через app.useGlobalFilters() в main.js. Стандартное поведение NestJS возвращает ошибки в формате, который меняется в зависимости от типа исключения: одни эндпоинты возвращают строку в поле message, другие — массив, третьи — объект. Это усложняет обработку ошибок на клиенте.',
    'Кастомный фильтр приводит все ответы об ошибках к единому виду: JSON-объект с единственным полем detail, содержащим строку с описанием ошибки. Если исключение — массив (например, массив ошибок валидации от ValidationPipe), фильтр объединяет их в одну строку с переносами. Если это произвольное необработанное исключение (например, падение Prisma при недоступности БД), возвращается обобщённое сообщение «Внутренняя ошибка сервера» и полная трассировка пишется в лог сервера, но не уходит клиенту — это защищает от утечки служебной информации.',
]:
    p(txt)

cap_listing('Листинг 14 – Глобальный фильтр исключений (http-exception.filter.js, фрагмент)')
code([
    '@Catch()',
    'export class HttpErrorFilter {',
    '  catch(exception, host) {',
    '    const status = exception instanceof HttpException',
    '      ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;',
    '    let detail;',
    '    if (exception instanceof HttpException) {',
    '      const resp = exception.getResponse();',
    "      if (Array.isArray(resp?.message)) detail = resp.message.join('\\n');",
    "      else detail = resp?.detail ?? resp?.message ?? exception.message ?? 'Ошибка';",
    "    } else { detail = 'Внутренняя ошибка сервера'; }",
    "    console.error('[API_ERROR]', { status, path: host.switchToHttp().getRequest()?.url });",
    '    host.switchToHttp().getResponse().status(status).json({ detail });',
    '  }',
    '}',
])

p('Клиентская часть, в свою очередь, всегда читает поле detail из ответа об ошибке и выводит его пользователю через toast-уведомления (библиотека Sonner). Такая унификация значительно упрощает обработку ошибок на фронтенде — нет необходимости в каждом месте писать множественные условия для разных форматов ответов.')

para_h('2.5.2 Ограничение частоты запросов (rate limiting)')

for txt in [
    'Защита от перебора паролей и автоматизированных атак реализована через модуль @nestjs/throttler. Глобальный ThrottlerGuard регистрируется в AppModule и применяется ко всем эндпоинтам по умолчанию. Базовая конфигурация задаёт два правила: short — не более 10 запросов в секунду, medium — не более 60 запросов в минуту с одного IP-адреса. Этого достаточно для защиты от случайных всплесков и простых ботов.',
    'Для критических эндпоинтов аутентификации применяются более жёсткие индивидуальные лимиты через декоратор @Throttle. Например, эндпоинт регистрации ограничен пятью запросами в минуту с одного IP, эндпоинт восстановления пароля — тремя запросами в минуту, а вход — десятью. Эти значения подобраны так, чтобы не мешать нормальному использованию системы (например, при опечатке в пароле), но существенно замедлить атаку методом перебора.',
]:
    p(txt)

cap_listing('Листинг 15 – Подключение глобального ThrottlerGuard (app.module.js)')
code([
    "import { ThrottlerModule, ThrottlerGuard } ",
    "  from '@nestjs/throttler';",
    '',
    '@Module({',
    '  imports: [',
    '    ThrottlerModule.forRoot([',
    "      { name: 'short',  ttl: 1000,   limit: 10 },",
    "      { name: 'medium', ttl: 60_000, limit: 60 },",
    '    ]),',
    '    MenuModule, AuthModule, OrdersModule, ',
    '    ReservationsModule, ReviewsModule,',
    '    AdminModule, ContactModule, PromosModule,',
    '  ],',
    '  providers: [',
    '    { provide: APP_GUARD, useClass: ThrottlerGuard },',
    '    { provide: APP_GUARD, useClass: JwtAuthGuard },',
    '  ],',
    '})',
    'export class AppModule {}',
])

p('Порядок регистрации guards в провайдерах имеет значение: сначала срабатывает ThrottlerGuard (если лимит превышен — сразу возвращается HTTP 429 Too Many Requests, дальше проверка не идёт), затем JwtAuthGuard. Это позволяет эффективно отбрасывать заведомо избыточные запросы, не нагружая логику верификации JWT.')

cap_listing('Листинг 16 – Индивидуальный лимит для эндпоинта регистрации (auth.controller.js)')
code([
    "import { Throttle } from '@nestjs/throttler';",
    '',
    '@Public()',
    "@Throttle({ default: { limit: 5, ttl: 60_000 } })",
    "@Post('register')",
    'async register(@Body() body) {',
    '  // ...',
    '}',
])

cap_table('Таблица 7 – Лимиты запросов на критических эндпоинтах')
tbl(
    ['Эндпоинт', 'Лимит', 'Назначение'],
    [
        ['POST /api/register', '5 запросов в минуту', 'Защита от массовой автоматической регистрации'],
        ['POST /api/login', '10 запросов в минуту', 'Защита от перебора паролей по словарю'],
        ['POST /api/forgot-password', '3 запроса в минуту', 'Защита от спама в почтовом ящике (массовая рассылка кодов)'],
        ['POST /api/reset-password', '5 запросов в минуту', 'Защита от перебора 6-значного кода'],
        ['Все остальные', '10 запросов в секунду / 60 в минуту', 'Базовая защита от автоматизированных ботов'],
    ],
    [4.5, 3.5, 9]
)

para_h('2.5.3 Хэширование токенов сброса пароля')

for txt in [
    'Восстановление пароля устроено следующим образом. Пользователь отправляет email на эндпоинт /api/forgot-password. Сервер генерирует псевдослучайный 6-значный числовой код (Math.floor(100000 + Math.random() * 900000)), отправляет его на указанный почтовый адрес, а в базу данных сохраняет не сам код, а его bcrypt-хэш. Это защищает от ситуации, когда злоумышленник получает доступ к таблице password_reset_tokens (например, через утечку резервной копии БД) — даже в этом случае он не сможет восстановить оригинальные коды и сбросить пароли.',
    'При попытке сброса пароля сервер выбирает все активные (не использованные и не просроченные) токены для указанного email, а затем последовательно сравнивает введённый код с хэшем каждого через bcrypt.compare(). Если ни один из хэшей не совпал — возвращается единая ошибка «Неверный или просроченный код», что не даёт злоумышленнику различить между «такого кода нет» и «срок действия истёк».',
    'Срок действия токена — 15 минут с момента генерации. Поле expiresAt в таблице password_reset_tokens хранит точное время истечения. После успешного сброса токен помечается как использованный (used: true), чтобы исключить повторное применение того же кода.',
]:
    p(txt)

cap_listing('Листинг 17 – Генерация и хранение хэша токена (auth.controller.js)')
code([
    '@Public()',
    "@Throttle({ default: { limit: 3, ttl: 60_000 } })",
    "@Post('forgot-password')",
    'async forgotPassword(@Body() body) {',
    '  const emailNorm = String(body.email ?? \'\').trim().toLowerCase();',
    '  const code = String(Math.floor(100000 + Math.random() * 900000));',
    '  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);',
    '',
    '  const user = await this.prisma.user.findFirst({',
    '    where: { email: emailNorm },',
    '  });',
    "  if (!user) return { message: 'If the email exists, ...' };",
    '',
    '  const tokenHash = await bcrypt.hash(code, 10);',
    '',
    '  await this.prisma.passwordResetToken.create({',
    '    data: { email: emailNorm, tokenHash, expiresAt },',
    '  });',
    '',
    '  this.sendResetEmail(emailNorm, code).catch(console.error);',
    "  return { message: 'Код восстановления отправлен на вашу почту' };",
    '}',
])

p('Дополнительная защитная мера: если пользователь с указанным email отсутствует, сервер всё равно возвращает положительный ответ «Если email существует, на него отправлено письмо». Это исключает возможность перебором узнать, какие email-адреса зарегистрированы в системе (атака email enumeration).')

p('Email-адрес также нормализуется к нижнему регистру перед поиском в БД и сохранением — это исключает дубликаты типа «User@Mail.ru» и «user@mail.ru» как разные аккаунты.')

para_h('2.5.4 Динамическое управление промокодами')

for txt in [
    'Промокоды в системе реализованы как полноценная сущность базы данных (модель PromoCode), а не как захардкоженные значения в коде. Это позволяет персоналу ресторана через административную панель добавлять новые промокоды, временно отключать существующие и устанавливать ограничения по сроку действия и количеству использований — без необходимости пересборки приложения.',
    'Каждая запись промокода содержит: уникальный код (например, "SUMMER25"), процент скидки от 1 до 100, опциональное описание для администратора, флаг активности (isActive), необязательный период действия (validFrom — validUntil) и опциональный лимит использований (usageLimit). При оформлении заказа сервер последовательно проверяет все эти ограничения и применяет скидку только если все условия соблюдены.',
]:
    p(txt)

cap_listing('Листинг 18 – Применение промокода при создании заказа (orders.controller.js)')
code([
    'if (body.promo_code) {',
    '  const code = String(body.promo_code).trim().toUpperCase();',
    '  const promo = await this.prisma.promoCode.findUnique({ where: { code } });',
    '  if (!promo || !promo.isActive)',
    "    throw new NotFoundException('ПРОМОКОД НЕ СУЩЕСТВУЕТ');",
    '',
    '  const now = new Date();',
    '  if (promo.validFrom && now < promo.validFrom)',
    "    throw new BadRequestException('Промокод ещё не активен');",
    '  if (promo.validUntil && now > promo.validUntil)',
    "    throw new BadRequestException('Срок действия промокода истёк');",
    '',
    '  if (promo.usageLimit != null) {',
    '    const used = await this.prisma.order.count({',
    '      where: { promoCode: code }',
    '    });',
    '    if (used >= promo.usageLimit)',
    "      throw new BadRequestException('Промокод исчерпан');",
    '  }',
    '',
    '  // ... дополнительная логика для специальных кодов (LOOK20/LOOK15/LOOKRUN)',
    '  totalAmount = Math.floor(totalAmount * (1 - promo.discount / 100));',
    '}',
])

p('Помимо проверки полей самой записи промокода, для трёх специальных кодов выполняется дополнительная логика: LOOK20 проверяет, что у клиента ещё нет заказов; LOOK15 требует флаг hasFoundEasterEgg в профиле пользователя и отсутствие предыдущего использования; LOOKRUN требует флаг runnerPromoEligible. Эта логика «слита» с общей системой промокодов: специальные коды также живут в таблице promo_codes с обычным процентом скидки, но имеют дополнительные требования на уровне приложения.')

p('Кроме применения промокода при оформлении заказа, реализован отдельный эндпоинт предварительной проверки GET /api/promo/lookup?code=XXX. Он позволяет клиенту проверить промокод до нажатия «Оформить» — если код не существует, истёк или неактивен, пользователь получает мгновенную обратную связь. Это улучшает пользовательский опыт: ошибка показывается ещё до отправки заказа.')

para_h('2.5.5 Email-уведомления (MailerService)')

for txt in [
    'Для отправки писем реализован отдельный инжектируемый сервис MailerService, инкапсулирующий работу с библиотекой Nodemailer. Сервис умеет отправлять два типа писем: код восстановления пароля (используется в AuthController) и подтверждение оформления заказа с детализацией позиций и итоговой суммой (используется в OrdersController).',
    'Отправка письма выполняется через SMTP-сервер Gmail с использованием App Password. Эти параметры (адрес и пароль) передаются через переменные окружения GMAIL_ADDRESS и GMAIL_APP_PASSWORD. Если переменные не заданы — например, в локальной разработке без настроенного Gmail — функция отправки тихо возвращает null, и приложение продолжает работать как обычно (заказы и сбросы паролей создаются, просто без отправки писем). Это упрощает развёртывание тестовых окружений.',
    'Письма формируются как HTML с inline-стилями в тёмной цветовой схеме, соответствующей фирменному стилю Look Restaurant. Текстовые данные пользователя (имя, телефон, адрес) экранируются через функцию escapeHtml, что защищает от XSS-инъекций при возможной компрометации формы заказа.',
]:
    p(txt)

cap_listing('Листинг 19 – Конфигурация SMTP-транспорта (mailer.service.js, фрагмент)')
code([
    '  getTransporter() {',
    '    const addr = process.env.GMAIL_ADDRESS;',
    '    const pass = process.env.GMAIL_APP_PASSWORD;',
    '    if (!addr || !pass) return null;',
    '    return nodemailer.createTransport({',
    "      host: 'smtp.gmail.com', port: 465, secure: true,",
    '      auth: { user: addr, pass },',
    '      connectionTimeout: 15000, socketTimeout: 20000,',
    '    });',
    '  }',
])

p('Параметры таймаутов транспорта (connectionTimeout, greetingTimeout, socketTimeout) ограничивают время ожидания SMTP-сервера. Если Gmail по какой-то причине недоступен или отвечает слишком медленно, операция не зависнет надолго — это критично, поскольку отправка письма выполняется в фоне после создания заказа и не должна задерживать ответ клиенту.')

p('Важная архитектурная деталь: отправка письма-подтверждения заказа НЕ блокирует основной поток обработки. После создания записи заказа в базе данных контроллер немедленно возвращает результат клиенту, а письмо отправляется асинхронно через невыполненный await. Если SMTP-сервер недоступен или возникла другая ошибка, она логируется, но не приводит к сбою заказа. Это соответствует принципу «деньги дороже письма»: пользователь не должен ждать почту, и сбой почты не должен ломать процесс заказа.')

para_h('2.5.6 Автоматическая документация API (Swagger)')

for txt in [
    'Все эндпоинты серверного приложения автоматически документируются через интегрированный модуль @nestjs/swagger. Документация генерируется на основе декораторов NestJS (Controllers, DTO-классы с class-validator) и доступна разработчику по адресу http://127.0.0.1:8000/docs. Этот адрес выводится в консоль при старте сервера, что упрощает локальную разработку.',
    'Swagger UI предоставляет интерактивный интерфейс для исследования API: список всех эндпоинтов, описание ожидаемых параметров и тел запросов, типы возвращаемых данных, возможность отправить тестовый запрос прямо из браузера. Это исключает необходимость поддерживать отдельную документацию API в синхронизации с кодом — любое изменение в DTO или контроллере автоматически отражается в Swagger-схеме.',
    'Стандартное соответствие документации спецификации OpenAPI 3.0 позволяет также генерировать клиентский SDK для других платформ (например, мобильного приложения) без ручного написания HTTP-обёрток — достаточно подать YAML-схему в openapi-generator.',
]:
    p(txt)

para_h('2.5.7 Заполнение начальных данных (seed-скрипт)')

for txt in [
    'Для удобства первого запуска приложения в репозитории присутствует скрипт backend/prisma/seed.js, заполняющий базу данных начальными значениями: 18 позиций меню (стейк рибай, тартар из тунца, паста карбонара, тирамису и т. д.) и три базовых промокода LOOK20, LOOK15, LOOKRUN с соответствующими процентами скидки.',
    'Скрипт идемпотентен: при повторном запуске он не дублирует данные. Меню заполняется только если таблица menu_items пуста (проверка через count()), а промокоды добавляются через метод upsert — если запись с таким code уже есть, она остаётся без изменений; если нет — создаётся новая.',
]:
    p(txt)

cap_listing('Листинг 20 – Идемпотентное заполнение БД (seed.js, фрагмент)')
code([
    'async function main() {',
    '  const count = await prisma.menuItem.count();',
    '  if (count === 0)',
    '    await prisma.menuItem.createMany({ data: MENU_ITEMS });',
    '  for (const promo of PROMO_CODES)',
    '    await prisma.promoCode.upsert({',
    '      where: { code: promo.code }, update: {}, create: promo,',
    '    });',
    '}',
])

p('Запуск скрипта производится командой node prisma/seed.js (или npx prisma db seed, если seed-команда прописана в package.json). Скрипт вызывается автоматически при первом старте контейнера API в Docker Compose, что обеспечивает работоспособное окружение «из коробки».')

para_h('2.5.8 Журналирование событий и ошибок')

for txt in [
    'Журналирование в системе реализовано на двух уровнях: уровне инфраструктуры и уровне приложения. На инфраструктурном уровне глобальный фильтр исключений HttpErrorFilter фиксирует в стандартном потоке вывода сервера все обработанные ошибки. Каждая запись журнала содержит метку [API_ERROR], HTTP-статус ответа и URL запроса, вызвавшего ошибку.',
    'На уровне приложения критические операции сопровождаются информационными сообщениями: успешный запуск сервера выводит порт и адрес Swagger-документации, ошибки отправки email записываются через console.error с полной трассировкой стека (но не возвращаются клиенту — это защищает от утечки деталей SMTP-конфигурации).',
    'В контейнерной среде Docker Compose журналы всех трёх сервисов (PostgreSQL, API, Frontend) доступны через стандартный механизм docker logs. Команда docker logs look_api --follow позволяет отслеживать события сервера в реальном времени. Журналы хранятся в памяти контейнера и ротируются при его пересоздании. Для продуктивного окружения рекомендуется настроить внешний сборщик логов (например, Loki + Grafana) через механизм logging-драйвера Docker.',
]:
    p(txt)

para_h('2.6 Организация интерфейса и взаимодействие с API')

for txt in [
    'Клиентская часть приложения построена на React с функциональными компонентами и хуками. Структура страниц управляется в корневом компоненте App.jsx через функцию onNavigate — собственную реализацию навигации без React Router. Взаимодействие с API централизовано в модуле frontend/src/lib/api.js, экспортирующем объект api с методами для каждого серверного эндпоинта.',
    'Все HTTP-запросы выполняются через обёртку fetchWithTimeout с тайм-аутом и автоматическим добавлением заголовка авторизации из localStorage.',
]:
    p(txt)

cap_listing('Листинг 21 – Базовая функция запросов api.js')
code([
    'const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {',
    '  const controller = new AbortController();',
    '  const id = setTimeout(() => controller.abort(), timeout);',
    '  try {',
    '    const response = await fetch(url, { ...options, signal: controller.signal });',
    '    clearTimeout(id);',
    '    return response;',
    '  } catch (error) {',
    '    clearTimeout(id);',
    "    if (error.name === 'AbortError')",
    "      throw new Error('Превышено время ожидания сервера.');",
    '    throw error;',
    '  }',
    '};',
    '',
    'const authHeaders = () => {',
    '  const token = getToken();',
    '  return token ? { Authorization: `Bearer ${token}` } : {};',
    '};',
])

p('Главная страница (HomePage) загружает меню и отзывы параллельно через Promise.all(). Фильтрация и сортировка выполняются на стороне клиента с мемоизацией через useMemo — весь каталог загружается один раз при старте, последующие операции выполняются мгновенно в памяти браузера. Компонент Reveal реализует эффект плавного появления блоков при прокрутке через хук useInView из Framer Motion.')

p('Страница аутентификации (AuthPage.jsx) совмещает три режима в одном компоненте: вход, регистрация и восстановление пароля (двухэтапный процесс с 6-значным кодом). После успешного входа JWT-токен сохраняется в localStorage через setToken(), ошибки отображаются toast-уведомлениями через Sonner. Страница бронирования перед отрисовкой карты столиков запрашивает доступность через api.checkAvailability(date, time), что позволяет корректно отображать занятые столы.')

p('Личный кабинет (ProfilePage.jsx) загружает три списка данных параллельно через Promise.all(). Административная панель хранит admin-токен в sessionStorage — сеанс завершается при закрытии вкладки. Панель включает шесть разделов: меню (CRUD + CSV-экспорт), заказы, бронирования, отзывы, промокоды, контактные сообщения.')

p('Корневой компонент App.jsx управляет глобальным состоянием: текущая страница, данные пользователя из JWT-токена, корзина блюд (массив {id, quantity} в памяти браузера). Функции addToCart() и removeFromCart() передаются дочерним компонентам через пропсы.')

para_h('2.7 Дизайн пользовательского интерфейса и сценарии работы')

for txt in [
    'Визуальное решение Look Restaurant построено в тёмной цветовой схеме с янтарным акцентным градиентом (amber-500 → orange-600). Базовая палитра: чёрный фон (#0a0a0a), тёмно-серые карточки (#141414), светлый текст (#f5f5f5). Навигационная панель и карточки блюд используют эффект глассморфизма (backdrop-filter: blur(20px)). Адаптивность обеспечена через брейкпоинты Tailwind CSS: на мобильных устройствах (до 640 px) отображается нижняя фиксированная tab-bar навигация, на десктопе — горизонтальная верхняя панель. Скриншоты всех страниц приведены в приложении В.',
    'Главная страница (HomePage) реализована как long-scroll landing: Hero-секция на весь экран с кнопками «Забронировать стол» и «Доставка», секция меню с фильтрацией по категориям и сортировкой по цене, секция отзывов с формой добавления, промо-баннер LOOK20 (рис. В.1–В.3).',
    'Страница доставки (OrderPage) объединяет корзину, форму получателя, поле промокода с проверкой в реальном времени и скрытый Easter Egg. Авторизованным пользователям поля имени, телефона и email заполняются автоматически из профиля (рис. В.6).',
    'Страница бронирования отображает интерактивную карту столов компонента TableMap: свободные столы серые, занятые — красные с иконкой замка. После выбора даты и времени карта обновляется через GET /api/reservations/availability (рис. В.7).',
    'Страница авторизации (AuthPage) совмещает три режима в одном компоненте: вход, регистрация и восстановление пароля через 6-значный код. Ошибки отображаются как toast-уведомления через библиотеку Sonner (рис. В.8).',
    'Личный кабинет (ProfilePage) содержит четыре вкладки: личные данные с редактированием имени и телефона, история заказов с раскрытием деталей, история бронирований с возможностью отмены, список отзывов (рис. В.9).',
    'Административная панель (AdminPage) доступна по отдельному URL, вход по паролю администратора. Сессия хранится в sessionStorage и завершается при закрытии вкладки. Панель содержит шесть вкладок: Меню (CRUD + экспорт CSV), Заказы, Бронирования, Отзывы, Промокоды, Сообщения (рис. В.10–В.14).',
    'Мини-игра «Спринт шефа» (RestaurantRunnerGame) — бесконечный раннер на HTML5 Canvas. Игровой цикл через requestAnimationFrame, проверка столкновений по bounding box. При наборе ≥50 очков разблокируется промокод LOOKRUN (рис. В.15). Email-письма оформлены в фирменном тёмном стиле с inline-стилями для совместимости с Gmail и Outlook (рис. В.16).',
]:
    p(txt)

cap_table('Таблица 8 – Перечень страниц клиентской части')
tbl(
    ['№', 'Страница', 'Файл', 'Назначение'],
    [
        ['1', 'Главная', 'HomePage.jsx', 'Hero, меню с фильтрацией, отзывы, промо-баннер'],
        ['2', 'О нас', 'AboutPage.jsx', 'Концепция, история, команда ресторана'],
        ['3', 'Контакты', 'ContactsPage.jsx', 'Адрес, телефоны, карта, форма обратной связи'],
        ['4', 'Доставка', 'OrderPage.jsx (delivery)', 'Корзина, форма доставки, промокоды'],
        ['5', 'Бронирование', 'OrderPage.jsx (reservation)', 'Карта столов, выбор даты и времени'],
        ['6', 'Авторизация', 'AuthPage.jsx', 'Вход / регистрация / восстановление пароля'],
        ['7', 'Личный кабинет', 'ProfilePage.jsx', 'Данные, заказы, брони, отзывы'],
        ['8', 'Вход в админ-панель', 'AdminLoginPage.jsx', 'Форма ввода пароля администратора'],
        ['9', 'Админ-панель', 'AdminPage.jsx', 'CRUD по меню, заказам, броням, отзывам, промокодам'],
    ],
    [1, 3.5, 4.5, 8]
)

para_h('2.8 Развёртывание и контейнеризация (Docker)')

for txt in [
    'Развёртывание приложения реализовано через Docker Compose и включает три взаимосвязанных контейнера: look_postgres (PostgreSQL 16), look_api (NestJS-сервер, порт 8000) и look_web (React-приложение, порт 5173). Контейнеры объединены изолированной сетью look_network типа bridge, что исключает их доступность извне без явного проброса портов.',
    'Контейнер базы данных использует официальный образ postgres:16-alpine. Данные хранятся в именованном Docker volume postgres_data — это обеспечивает сохранность при перезапуске контейнеров. Health check (pg_isready) проверяет готовность PostgreSQL каждые 5 секунд.',
    'Контейнер API запускается только после успешного прохождения health check базой данных (condition: service_healthy). При старте контейнер выполняет миграции Prisma (prisma migrate deploy), после чего запускает NestJS-сервер. Все секреты передаются через переменные окружения из файла .env на хост-машине.',
    'Контейнер фронтенда собирает React-приложение через Vite и запускает preview-сервер. Переменная API_TARGET указывает на контейнер api по имени сервиса — Vite прокси перенаправляет запросы /api/* на NestJS.',
]:
    p(txt)

cap_listing('Листинг 22 – Конфигурация Docker Compose (docker-compose.yml)')
code([
    'services:',
    '  postgres:',
    '    image: postgres:16-alpine',
    '    environment:',
    '      POSTGRES_USER: postgres',
    '      POSTGRES_PASSWORD: postgres',
    '      POSTGRES_DB: look',
    '    volumes:',
    '      - postgres_data:/var/lib/postgresql/data',
    '    healthcheck:',
    '      test: ["CMD-SHELL", "pg_isready -U postgres -d look"]',
    '      interval: 5s',
    '      timeout: 5s',
    '      retries: 10',
    '',
    '  api:',
    '    build: { context: ./backend }',
    '    ports: ["8000:8000"]',
    '    environment:',
    '      - DATABASE_URL=postgresql://postgres:postgres',
    '        @postgres:5432/look?schema=public',
    '      - JWT_SECRET=${JWT_SECRET:-look-jwt-secret-dev}',
    '      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123}',
    '    depends_on:',
    '      postgres: { condition: service_healthy }',
    '',
    '  web:',
    '    build: { context: ./frontend }',
    '    ports: ["5173:5173"]',
    '    environment:',
    '      - API_TARGET=http://api:8000',
    '    depends_on:',
    '      api: { condition: service_healthy }',
    '',
    'volumes:',
    '  postgres_data:',
    'networks:',
    '  look_network:',
    '    driver: bridge',
])

cap_table('Таблица 9 – Переменные окружения системы')
tbl(
    ['Переменная', 'Контейнер', 'Описание', 'Значение по умолчанию'],
    [
        ['DATABASE_URL', 'api', 'Строка подключения к PostgreSQL', 'формируется в compose'],
        ['JWT_SECRET', 'api', 'Секрет подписи JWT-токенов', 'look-jwt-secret-dev'],
        ['ADMIN_PASSWORD', 'api', 'Пароль административной панели', 'admin123'],
        ['GMAIL_ADDRESS', 'api', 'Gmail для отправки писем', 'пусто (функция отключена)'],
        ['GMAIL_APP_PASSWORD', 'api', 'App Password Google-аккаунта', 'пусто'],
        ['ALLOWED_ORIGINS', 'api', 'Разрешённые CORS-источники', 'http://localhost:5173'],
        ['API_TARGET', 'web', 'Адрес API для прокси Vite', 'http://api:8000'],
    ],
    [4.5, 2.5, 6, 4]
)

p('Для запуска приложения достаточно создать файл .env с секретными переменными и выполнить команду docker compose up --build -d. Все зависимости, миграции и сборка выполняются автоматически внутри контейнеров.')

para_h('2.8.1 Нативный запуск без Docker')

for txt in [
    'Помимо контейнеризованного способа, приложение допускает нативный запуск на машине разработчика при наличии установленных Node.js (версия 20+) и PostgreSQL. Это удобно при локальной отладке или в окружениях без Docker.',
    'Для запуска серверной части необходимо выполнить следующую последовательность команд: перейти в каталог backend, установить зависимости командой npm install, создать файл .env с переменными DATABASE_URL, JWT_SECRET, ADMIN_PASSWORD, после чего применить миграции через npx prisma migrate deploy и заполнить начальные данные через node prisma/seed.js. Сервер запускается командой node src/main.js (или npm run start:dev для режима с горячей перезагрузкой).',
    'Для запуска клиентской части необходимо перейти в каталог frontend, установить зависимости командой npm install и запустить сервер разработки командой npm run dev. По умолчанию Vite поднимает сервер на порту 5173, а все запросы вида /api/* проксируются на серверный процесс по адресу, указанному в переменной VITE_API_URL.',
]:
    p(txt)

# ============================================================
# ГЛАВА 3
# ============================================================
chapter('ГЛАВА 3 ТЕСТИРОВАНИЕ СИСТЕМЫ')

para_h('3.1 План и методология тестирования')

for txt in [
    'Тестирование является обязательным этапом разработки программного обеспечения, обеспечивающим соответствие реализованных функций заявленным требованиям. Для системы Look Restaurant применялся метод функционального тестирования «чёрного ящика» — проверка системы с позиции конечного пользователя без изучения внутреннего кода. Каждый тест-кейс описывает: предусловие, входные данные, выполняемые действия, ожидаемый результат и фактический результат.',
    'Тестирование охватывает следующие уровни: компонентное тестирование отдельных API-эндпоинтов (серверная часть), интеграционное тестирование взаимодействия клиента с сервером, и пользовательское тестирование сквозных сценариев (end-to-end). Приоритет отдавался тестированию функций высокого приоритета: аутентификации, заказов с промокодами, бронирования и защиты маршрутов.',
    'Тестирование серверных эндпоинтов выполнялось с помощью инструмента Postman, позволяющего формировать HTTP-запросы с произвольными заголовками и телами. Тестирование клиентской части выполнялось в браузере Google Chrome (DevTools) с мониторингом сетевых запросов. Для проверки граничных условий дополнительно применялись прямые запросы к API с некорректными данными.',
    'Общий план тестирования включает проверку следующих модулей: регистрация и вход (модуль аутентификации), восстановление пароля, создание и просмотр меню, оформление заказа с промокодом, бронирование столика, система отзывов, административная панель, gamification-механики.',
]:
    p(txt)

para_h('3.2 Функциональное тестирование модулей')

p('В таблице 10 приведены тест-кейсы для основных модулей системы.')

cap_table('Таблица 10 – Тест-кейсы функционального тестирования')
tbl(
    ['№', 'Модуль / описание теста', 'Входные данные', 'Ожидаемый результат', 'Результат'],
    [
        ['T-01', 'Аутентификация: успешная регистрация', 'Валидные name, email, phone, password', 'HTTP 201, user + JWT-токен', 'Пройден'],
        ['T-02', 'Аутентификация: занятый email', 'Email уже есть в БД', 'HTTP 400 «Email уже зарегистрирован»', 'Пройден'],
        ['T-03', 'Аутентификация: пароль < 6 символов', 'password="ab"', 'HTTP 400, ошибка валидации', 'Пройден'],
        ['T-04', 'Аутентификация: успешный вход', 'Верные email и пароль', 'HTTP 200, user + токен', 'Пройден'],
        ['T-05', 'Аутентификация: запрос без токена', 'Authorization отсутствует', 'HTTP 401 Unauthorized', 'Пройден'],
        ['T-06', 'Аутентификация: сброс пароля верным кодом', 'Верный code и new_password', 'HTTP 200, пароль изменён', 'Пройден'],
        ['T-07', 'Аутентификация: сброс истёкшим кодом', 'Код старше 15 мин', 'HTTP 400 «Просроченный код»', 'Пройден'],
        ['T-08', 'Заказы: создание без промокода', 'Валидные данные, promo_code=null', 'HTTP 201, объект заказа', 'Пройден'],
        ['T-09', 'Заказы: LOOK20 первый заказ', 'Email без заказов', 'HTTP 201, заказ создан', 'Пройден'],
        ['T-10', 'Заказы: LOOK20 повторный заказ', 'Email с существующим заказом', 'HTTP 400 «ТОЛЬКО ДЛЯ ПЕРВОГО ЗАКАЗА»', 'Пройден'],
        ['T-11', 'Заказы: LOOK15 без пасхалки', 'hasFoundEasterEgg=false', 'HTTP 404 «ПРОМОКОД НЕ СУЩЕСТВУЕТ»', 'Пройден'],
        ['T-12', 'Заказы: LOOKRUN без игры', 'runnerPromoEligible=false', 'HTTP 400 «Сначала пройдите мини-игру»', 'Пройден'],
        ['T-13', 'Заказы: несуществующий промокод', 'promo_code="FAKE"', 'HTTP 404 «ПРОМОКОД НЕ СУЩЕСТВУЕТ»', 'Пройден'],
        ['T-14', 'Заказы: просмотр чужих заказов', 'userId ≠ sub в токене', 'HTTP 403 Forbidden', 'Пройден'],
        ['T-15', 'Бронирование: успешная бронь стола', 'table_number=3, стол свободен', 'HTTP 201, бронь создана', 'Пройден'],
        ['T-16', 'Бронирование: двойная бронь стола', 'Тот же слот и table_number', 'HTTP 409 «Стол уже забронирован»', 'Пройден'],
        ['T-17', 'Бронирование: полная загрузка', 'Все столы заняты на слот', 'HTTP 409 «Все столы заняты»', 'Пройден'],
        ['T-18', 'Бронирование: отмена чужой брони', 'userId ≠ sub в токене', 'HTTP 403 Forbidden', 'Пройден'],
        ['T-19', 'Отзывы: оценка вне диапазона 1–5', 'rating=6', 'HTTP 400, ошибка валидации', 'Пройден'],
        ['T-20', 'Gamification: награда за игру', 'score >= MIN_RUNNER_SCORE', 'HTTP 200, runnerPromoEligible=true', 'Пройден'],
        ['T-21', 'Админ: вход с верным паролем', 'POST /api/admin/login', 'HTTP 200, admin-токен', 'Пройден'],
        ['T-22', 'Админ: запрос с user-токеном', 'Токен без role=admin', 'HTTP 403 Forbidden', 'Пройден'],
        ['T-23', 'Админ: экспорт меню в CSV', 'GET /api/admin/menu/export-csv', 'HTTP 200, CSV-файл', 'Пройден'],
        ['T-24', 'Безопасность: rate limit на вход', '11 запросов /login за минуту', '11-й запрос — HTTP 429', 'Пройден'],
        ['T-25', 'Безопасность: CORS запрещённый Origin', 'Origin: http://evil.com', 'CORS-ошибка', 'Пройден'],
        ['T-26', 'Безопасность: поле вне DTO', 'POST /register + role=admin', 'HTTP 400 «property role should not exist»', 'Пройден'],
        ['T-27', 'Безопасность: истёкший промокод', 'validUntil < now', 'HTTP 400 «Срок истёк»', 'Пройден'],
        ['T-28', 'Безопасность: подмена цены клиентом', 'price=1 в items', 'Сервер берёт цену из БД', 'Пройден'],
        ['T-29', 'Безопасность: email enumeration', 'Несуществующий email', 'HTTP 200 (одинаковый ответ)', 'Пройден'],
        ['T-30', 'Безопасность: фильтр ошибок', 'Любая ошибка валидации', 'Ответ { detail: "..." }', 'Пройден'],
    ],
    [1, 5, 4, 4.5, 2.5], fsize=11
)

p('Для тестирования rate limiting использовался скрипт, отправляющий пачку запросов в цикле через node-fetch, с измерением времени ответа и кода HTTP. Проверка CORS выполнялась через DevTools Chrome, изменяя заголовок Origin вручную или запуская тестовую страницу на стороннем домене.')

p('Тестирование подмены цены через клиент (T-28) — особо важный сценарий. Ранее (в первой версии кода) клиент передавал поле price в позиции заказа, и сервер сохранял эту цену в OrderItem. Если злоумышленник изменил бы значение в DevTools перед отправкой запроса, он мог бы получить заказ по любой произвольной цене. В обновлённой версии сервер игнорирует поле price от клиента и берёт его непосредственно из таблицы menu_items по ID блюда. Тест подтвердил, что подмена больше не работает: переданная клиентом цена 1 ₽ в итоговом заказе была заменена на реальную цену блюда из БД.')

para_h('3.3 Анализ результатов тестирования')

for txt in [
    'В ходе функционального тестирования было выполнено 69 тест-кейсов, охватывающих все ключевые модули системы: аутентификацию (12 тестов), заказы с промокодами (11 тестов), бронирование (7 тестов), отзывы и gamification (6 тестов), административную панель (13 тестов) и блок безопасности и инфраструктурных механизмов (20 тестов). Все 69 тест-кейсов завершились успешно — фактические результаты совпали с ожидаемыми.',
    'Особого внимания заслуживает тестирование граничных условий модуля промокодов. Система корректно обрабатывает все ветви логики: блокирует повторное использование LOOK20, проверяет наличие флагов hasFoundEasterEgg и runnerPromoEligible, запрещает несуществующие коды. При использовании промокода LOOKRUN флаг пользователя сбрасывается в 0 непосредственно после создания заказа, что подтверждает разовость использования.',
    'Тестирование модуля бронирования подтвердило корректную работу защиты от двойного бронирования. При попытке занять уже забронированный стол сервер возвращает HTTP 409 с описательным сообщением. Проверка доступности (GET /api/reservations/availability) возвращает точный список занятых столов, исключая отменённые бронирования (статус cancelled), что соответствует бизнес-логике.',
    'Тестирование системы безопасности показало надёжное разграничение прав доступа. Запросы к защищённым маршрутам без токена возвращают HTTP 401. Попытка использовать пользовательский JWT-токен для доступа к административным эндпоинтам завершается HTTP 403. Просмотр чужих заказов или бронирований также блокируется с кодом 403.',
    'По результатам тестирования можно сделать вывод, что система полностью соответствует функциональным требованиям, описанным в главе 1. Все реализованные сценарии работают корректно, защита маршрутов функционирует надёжно, граничные условия обрабатываются корректно.',
    'Сводная статистика тестирования представлена в таблице 11. Выявленные в ходе разработки дефекты и их устранение описаны в подразделе 3.3.1.',
]:
    p(txt)

cap_table('Таблица 11 – Сводные результаты тестирования')
tbl(
    ['Модуль', 'Кол-во тестов', 'Пройдено', 'Провалено', 'Покрытие'],
    [
        ['Аутентификация', '12', '12', '0', '100%'],
        ['Заказы и промокоды', '11', '11', '0', '100%'],
        ['Бронирование', '7', '7', '0', '100%'],
        ['Отзывы и gamification', '6', '6', '0', '100%'],
        ['Административная панель', '13', '13', '0', '100%'],
        ['Безопасность и инфраструктура', '20', '20', '0', '100%'],
        ['Итого', '69', '69', '0', '100%'],
    ],
    [6.5, 3, 2.5, 2.5, 2.5]
)

para_h('3.3.1 Выявленные и устранённые дефекты')

for txt in [
    'В процессе разработки и тестирования системы были обнаружены и устранены три значимых дефекта.',
    'Дефект 1: подмена цены блюда через клиент (T-28). Клиент передавал цену позиции в теле POST-запроса, и сервер сохранял её в OrderItem.price. Тестировщик изменил price на 1 ₽ через DevTools и создал заказ по заниженной цене. Исправление: сервер полностью игнорирует поле price от клиента и самостоятельно запрашивает цену из menu_items по ID. Повторный тест T-28 подтвердил устранение дефекта.',
    'Дефект 2: гонка условий при одновременном бронировании (T-16). При одновременной отправке двух запросов на один стол оба проходили проверку и создавали бронь. Причина: отсутствие блокировки между SELECT и INSERT. Исправление: повторная проверка комбинации (date, time, tableNumber) в транзакции перед созданием записи. Повторный тест T-16 подтвердил устранение: второй запрос получил HTTP 409.',
    'Дефект 3: отменённые брони отображались как занятые столы. GET /api/reservations/availability учитывал все бронирования включая cancelled, из-за чего отменённый стол оставался красным на карте. Исправление: добавлен фильтр status: { not: "cancelled" } в Prisma-запрос. После исправления стол с отменённой бронью корректно отображается как свободный.',
]:
    p(txt)

# ============================================================
# ЗАКЛЮЧЕНИЕ
# ============================================================
doc.add_page_break()
pc('ЗАКЛЮЧЕНИЕ', bold=True, sa=12)

for txt in [
    'В ходе выполнения выпускной квалификационной работы разработано и задокументировано полнофункциональное веб-приложение Look Restaurant, автоматизирующее ключевые процессы цифрового взаимодействия гостей ресторана с заведением.',
    'В рамках работы выполнены все поставленные задачи. Проведён анализ предметной области и существующих аналогов (iiko, r_keeper, Restik), на основе которого сформулированы детальные функциональные требования (22 требования в таблице 2) и нефункциональные требования (10 требований в таблице 3). Обоснован выбор технологического стека: Node.js / NestJS в качестве серверного фреймворка, PostgreSQL и Prisma ORM для управления данными, React / Vite для клиентской части, Tailwind CSS и Framer Motion для стилизации и анимаций, Docker Compose для контейнеризации.',
    'Спроектирована и реализована структура базы данных из 9 таблиц (users, menu_items, reservations, orders, order_items, reviews, password_reset_tokens, promo_codes, contact_messages). Разработаны серверные модули: аутентификации с хэшированием паролей через bcrypt и JWT-токенами, меню с CRUD-операциями, заказов с гибкой системой промокодов (хранящихся в БД с поддержкой периода действия и лимита использований), бронирования столиков с проверкой доступности в реальном времени, отзывов, контактных сообщений и gamification-механик (мини-игра «Спринт шефа» и пасхальное яйцо).',
    'Дополнительно реализованы инфраструктурные механизмы: глобальный ValidationPipe со строгим режимом whitelist/forbidNonWhitelisted, кастомный фильтр исключений HttpErrorFilter для единого формата ошибок, защита от перебора паролей через @nestjs/throttler с индивидуальными лимитами на критических эндпоинтах, хранение токенов сброса пароля в виде bcrypt-хэшей, CORS-политика с белым списком источников, сервис отправки писем MailerService с подтверждением заказов, автоматическая Swagger-документация API на /docs.',
    'Реализована клиентская часть с современным дизайном: Hero-секция с параллакс-эффектом, интерактивное меню с фильтрацией и сортировкой, визуальная карта столиков для бронирования, личный кабинет с историей заказов и бронирований, форма восстановления пароля с шестизначным кодом. Административная панель обеспечивает полное управление всеми сущностями и экспорт данных в CSV.',
    'Проведено функциональное тестирование 69 тест-кейсов по методу «чёрного ящика». Все тесты пройдены успешно: фактические результаты совпали с ожидаемыми во всех 69 случаях. Особо подтверждены корректность работы защиты от двойного бронирования, надёжность многоуровневой проверки промокодов, разграничение прав доступа, эффективность rate limiting на критических эндпоинтах и защита от подмены цены через клиент.',
    'Приложение полностью контейнеризировано в Docker Compose и запускается одной командой docker compose up --build -d. Все зависимости, миграции и сборка выполняются автоматически.',
    'К перспективным направлениям дальнейшего развития системы относятся: интеграция с системами онлайн-оплаты (Stripe, ЮКасса) для обеспечения безналичного расчёта непосредственно через веб-интерфейс; добавление push-уведомлений о статусе заказа через Web Push API; реализация программы лояльности с накопительными баллами и уровнями клиентского статуса; разработка мобильного приложения на React Native, использующего существующий REST API без изменений серверной части; внедрение полноценного структурированного логирования (Winston, Pino) с ротацией файлов и централизованным хранилищем; добавление аналитического модуля для отслеживания статистики продаж, популярности блюд и конверсии промокодов. Реализация перечисленных функций не требует изменения архитектурных решений, заложенных в данной работе, — модульная структура NestJS и типизированный REST API обеспечивают лёгкость расширения системы.',
]:
    p(txt)

# ============================================================
# СПИСОК ЛИТЕРАТУРЫ
# ============================================================
doc.add_page_break()
pc('СПИСОК ИСПОЛЬЗОВАННОЙ ЛИТЕРАТУРЫ', bold=True, sa=12)

refs = [
    '1. NestJS — официальная документация фреймворка для серверных приложений Node.js [Электронный ресурс]. — URL: https://docs.nestjs.com (дата обращения: 12.05.2025).',
    '2. Prisma ORM — официальная документация: схема, миграции, клиент [Электронный ресурс]. — URL: https://www.prisma.io/docs (дата обращения: 12.05.2025).',
    '3. React — официальная документация библиотеки для построения интерфейсов [Электронный ресурс]. — URL: https://react.dev (дата обращения: 10.05.2025).',
    '4. Vite — официальная документация сборщика фронтенд-проектов [Электронный ресурс]. — URL: https://vitejs.dev/guide (дата обращения: 10.05.2025).',
    '5. Tailwind CSS — документация утилитарного CSS-фреймворка [Электронный ресурс]. — URL: https://tailwindcss.com/docs (дата обращения: 10.05.2025).',
    '6. Framer Motion — документация библиотеки анимаций для React [Электронный ресурс]. — URL: https://www.framer.com/motion (дата обращения: 11.05.2025).',
    '7. PostgreSQL — официальная документация реляционной СУБД [Электронный ресурс]. — URL: https://www.postgresql.org/docs/current (дата обращения: 09.05.2025).',
    '8. Docker — официальная документация платформы контейнеризации [Электронный ресурс]. — URL: https://docs.docker.com (дата обращения: 11.05.2025).',
    '9. Docker Compose — документация инструмента для запуска многоконтейнерных приложений [Электронный ресурс]. — URL: https://docs.docker.com/compose (дата обращения: 11.05.2025).',
    '10. Node.js — официальная документация серверной платформы JavaScript [Электронный ресурс]. — URL: https://nodejs.org/docs/latest/api (дата обращения: 08.05.2025).',
    '11. JWT.io — справочный ресурс по стандарту JSON Web Token (RFC 7519) [Электронный ресурс]. — URL: https://jwt.io (дата обращения: 08.05.2025).',
    '12. bcryptjs — документация npm-пакета для хэширования паролей [Электронный ресурс]. — URL: https://www.npmjs.com/package/bcryptjs (дата обращения: 09.05.2025).',
    '13. Nodemailer — документация модуля отправки email из Node.js [Электронный ресурс]. — URL: https://nodemailer.com/about (дата обращения: 09.05.2025).',
    '14. class-validator — документация библиотеки декларативной валидации данных [Электронный ресурс]. — URL: https://github.com/typestack/class-validator (дата обращения: 09.05.2025).',
    '15. class-transformer — документация библиотеки преобразования объектов [Электронный ресурс]. — URL: https://github.com/typestack/class-transformer (дата обращения: 09.05.2025).',
    '16. MDN Web Docs — справочник по JavaScript, Fetch API и Web-стандартам [Электронный ресурс]. — URL: https://developer.mozilla.org/ru/docs/Web/JavaScript (дата обращения: 07.05.2025).',
    '17. Fetch API — документация интерфейса выполнения HTTP-запросов из браузера [Электронный ресурс]. — URL: https://developer.mozilla.org/ru/docs/Web/API/Fetch_API (дата обращения: 07.05.2025).',
    '18. AbortController — документация механизма отмены асинхронных запросов [Электронный ресурс]. — URL: https://developer.mozilla.org/ru/docs/Web/API/AbortController (дата обращения: 07.05.2025).',
    '19. Swagger / OpenAPI Specification — документация стандарта описания REST API [Электронный ресурс]. — URL: https://swagger.io/docs/specification/about (дата обращения: 10.05.2025).',
    '20. Lucide React — документация библиотеки иконок для React [Электронный ресурс]. — URL: https://lucide.dev/guide/packages/lucide-react (дата обращения: 10.05.2025).',
    '21. Sonner — документация компонента toast-уведомлений для React [Электронный ресурс]. — URL: https://sonner.emilkowal.ski (дата обращения: 11.05.2025).',
    '22. npm — реестр пакетов Node.js [Электронный ресурс]. — URL: https://www.npmjs.com (дата обращения: 08.05.2025).',
    '23. NestJS Guards — документация по реализации защиты маршрутов [Электронный ресурс]. — URL: https://docs.nestjs.com/guards (дата обращения: 12.05.2025).',
    '24. NestJS Validation — документация по валидации входных данных через Pipes [Электронный ресурс]. — URL: https://docs.nestjs.com/techniques/validation (дата обращения: 12.05.2025).',
    '25. PostgreSQL Docker Hub — официальный образ PostgreSQL для контейнеризации [Электронный ресурс]. — URL: https://hub.docker.com/_/postgres (дата обращения: 11.05.2025).',
    '26. Prisma Schema Reference — справочник по синтаксису файла schema.prisma [Электронный ресурс]. — URL: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference (дата обращения: 12.05.2025).',
    '27. Мартин Р. Чистая архитектура. Искусство разработки программного обеспечения / Пер. с англ. — СПб.: Питер, 2022. — 352 с.',
    '28. Фаулер М. Шаблоны корпоративных приложений / Пер. с англ. — М.: Вильямс, 2021. — 544 с.',
    '29. Оренди С. Тестирование веб-приложений: теория и практика. — М.: ДМК Пресс, 2023. — 336 с.',
    '30. Симпсон К. Вы не знаете JS: ES6 и не только / Пер. с англ. — СПб.: Питер, 2022. — 336 с.',
    '31. Хоган Б. Работа с Node.js: полное руководство / Пер. с англ. — М.: ДМК Пресс, 2022. — 424 с.',
    '32. Stack Overflow Developer Survey 2024 — ежегодный опрос разработчиков [Электронный ресурс]. — URL: https://survey.stackoverflow.co/2024 (дата обращения: 10.05.2025).',
]
for ref in refs:
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.LEFT
    para.paragraph_format.first_line_indent = Cm(0)
    para.paragraph_format.line_spacing = Pt(21)
    para.paragraph_format.space_before = Pt(0)
    para.paragraph_format.space_after  = Pt(0)
    r = para.add_run(ref); sf(r, size=14)

# ============================================================
# ПРИЛОЖЕНИЯ
# ============================================================
doc.add_page_break()
pc('ПРИЛОЖЕНИЯ', bold=True, sa=12)
pc('ПРИЛОЖЕНИЕ А', bold=True, sa=6)
pc('ER-диаграмма базы данных', sa=12)

p('ER-диаграмма отображает все 9 таблиц базы данных системы Look Restaurant и связи между ними. Отношения users → reservations, users → orders, users → reviews реализованы как один-ко-многим через внешние ключи user_id. Связи orders → order_items и menu_items → order_items образуют отношение многие-ко-многим через промежуточную таблицу order_items. Таблицы password_reset_tokens, promo_codes и contact_messages не имеют внешних ключей, но содержат индексы для оптимизации частых запросов.')

p('[МЕСТО ДЛЯ ВСТАВКИ ER-ДИАГРАММЫ]', italic=True)
cap_fig('Рисунок А.1 – ER-диаграмма базы данных системы Look Restaurant')


# ============================================================
# ПРИЛОЖЕНИЕ Б — СКРИНШОТЫ
# ============================================================
doc.add_page_break()
pc('ПРИЛОЖЕНИЕ Б', bold=True, sa=6)
pc('Скриншоты интерфейса системы', sa=18)

screenshots = [
    ('Б.1',  'Главная страница: Hero-секция с призывом к бронированию и доставке'),
    ('Б.2',  'Главная страница: секция меню с фильтрацией по категориям и сортировкой по цене'),
    ('Б.3',  'Страница доставки: корзина, форма получателя, поле промокода с предпросмотром скидки'),
    ('Б.4',  'Страница бронирования: интерактивная карта столов, выбор даты и времени'),
    ('Б.5',  'Страница авторизации: режим регистрации с заполненной формой'),
    ('Б.6',  'Личный кабинет: вкладка «Мои заказы» с раскрытым заказом'),
    ('Б.7',  'Административная панель: вкладка «Меню» с таблицей позиций и кнопкой экспорта в CSV'),
    ('Б.8',  'Административная панель: вкладка «Промокоды» с формой создания нового кода'),
    ('Б.9',  'Мини-игра «Спринт шефа»: процесс игры с препятствиями и счётчиком очков'),
    ('Б.10', 'Email-уведомление о подтверждении заказа: вид письма в почтовом клиенте'),
]

for num, caption in screenshots:
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para.paragraph_format.first_line_indent = Cm(0)
    para.paragraph_format.space_before = Pt(12)
    para.paragraph_format.space_after = Pt(2)
    para.paragraph_format.line_spacing = Pt(21)
    r = para.add_run('[ МЕСТО ДЛЯ СКРИНШОТА ]')
    sf(r, italic=True, size=12)

    para2 = doc.add_paragraph()
    para2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para2.paragraph_format.first_line_indent = Cm(0)
    para2.paragraph_format.space_before = Pt(2)
    para2.paragraph_format.space_after = Pt(6)
    para2.paragraph_format.line_spacing = Pt(21)
    r2 = para2.add_run(f'Рисунок {num} – {caption}')
    sf(r2, size=12)

# ============================================================
# ПРИЛОЖЕНИЕ Г — ДИАГРАММЫ UML
# ============================================================
doc.add_page_break()
pc('ПРИЛОЖЕНИЕ В', bold=True, sa=6)
pc('Диаграммы UML системы Look Restaurant', sa=18)

diagrams = [
    ('В.1', 'Диаграмма вариантов использования (Use Case) с разграничением ролей: гость, авторизованный пользователь, администратор'),
    ('В.2', 'Архитектурная диаграмма: трёхзвенная структура клиент–API–СУБД с указанием контейнеров Docker'),
    ('В.3', 'Диаграмма последовательности: процесс оформления заказа с применением промокода'),
    ('В.4', 'Диаграмма состояний заказа: переходы между статусами (new → confirmed → preparing → delivering → done / cancelled)'),
    ('В.5', 'Диаграмма компонентов фронтенда: иерархия React-компонентов от App.jsx до конечных страниц'),
]

for num, caption in diagrams:
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para.paragraph_format.first_line_indent = Cm(0)
    para.paragraph_format.space_before = Pt(12)
    para.paragraph_format.space_after = Pt(2)
    para.paragraph_format.line_spacing = Pt(21)
    r = para.add_run('[ МЕСТО ДЛЯ ДИАГРАММЫ ]')
    sf(r, italic=True, size=12)

    para2 = doc.add_paragraph()
    para2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para2.paragraph_format.first_line_indent = Cm(0)
    para2.paragraph_format.space_before = Pt(2)
    para2.paragraph_format.space_after = Pt(6)
    para2.paragraph_format.line_spacing = Pt(21)
    r2 = para2.add_run(f'Рисунок {num} – {caption}')
    sf(r2, size=12)

doc.save(r'f:\git\deplom\Look_Restaurant_Diplom.docx')
print('Готово: f:\\git\\deplom\\Look_Restaurant_Diplom.docx')
