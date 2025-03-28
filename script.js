// 配置Monaco Editor的加载路径
require.config({
    paths: {
        'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.0/min/vs'
    }
});

// AI配置
const AI_CONFIG = {
    apiKey: 'sk-L6kOE4pyrPrOTkrbMQslrYX4tZXPdWhbhy7NbkH4UQmHgmuj',
    baseUrl: 'https://api.gptgod.online/v1/chat/completions',
    model: 'gemini-2.0-flash-exp'
};

// 定义Monaco Editor变量
let editor;
let currentTheme = 'vs'; // 默认使用白色主题 ('vs' 为白色, 'vs-dark' 为黑色)
let currentLanguage = 'python'; // 默认语言为Python
let currentFileName = 'example.py'; // 默认文件名
const STORAGE_KEY = 'monaco_editor_files'; // localStorage存储键名

// 文件和语言映射
const languageMap = {
    'py': 'python',
    'c': 'c',
    'h': 'c',
    'cpp': 'cpp',
    'cc': 'cpp',
    'hpp': 'cpp',
    'html': 'html',
    'htm': 'html',
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'json': 'json',
    'md': 'markdown',
    'markdown': 'markdown',
    'php': 'php',
    'go': 'go',
    'java': 'java',
    'rb': 'ruby',
    'ruby': 'ruby',
    'swift': 'swift',
    'kt': 'kotlin',
    'rs': 'rust',
    'sql': 'sql',
    'sh': 'shell',
    'bash': 'shell',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'cs': 'csharp',
    'vb': 'vb',
    'lua': 'lua',
    'pl': 'perl',
    'r': 'r'
};

// 语言和图标映射
const languageIcons = {
    'python': '<i class="fa-brands fa-python"></i>',
    'c': '<i class="fa-solid fa-copyright"></i>',
    'cpp': '<i class="fa-solid fa-c"></i>',
    'html': '<i class="fa-brands fa-html5"></i>',
    'javascript': '<i class="fa-brands fa-js"></i>',
    'typescript': '<i class="fa-brands fa-js"></i>',
    'css': '<i class="fa-brands fa-css3-alt"></i>',
    'scss': '<i class="fa-brands fa-sass"></i>',
    'less': '<i class="fa-brands fa-css3"></i>',
    'json': '<i class="fa-solid fa-code"></i>',
    'markdown': '<i class="fa-brands fa-markdown"></i>',
    'php': '<i class="fa-brands fa-php"></i>',
    'go': '<i class="fa-solid fa-g"></i>',
    'java': '<i class="fa-brands fa-java"></i>',
    'ruby': '<i class="fa-solid fa-gem"></i>',
    'swift': '<i class="fa-solid fa-s"></i>',
    'kotlin': '<i class="fa-solid fa-k"></i>',
    'rust': '<i class="fa-solid fa-r"></i>',
    'sql': '<i class="fa-solid fa-database"></i>',
    'shell': '<i class="fa-solid fa-terminal"></i>',
    'yaml': '<i class="fa-solid fa-file-code"></i>',
    'xml': '<i class="fa-solid fa-code"></i>',
    'csharp': '<i class="fa-solid fa-hashtag"></i>',
    'vb': '<i class="fa-solid fa-v"></i>',
    'lua': '<i class="fa-solid fa-moon"></i>',
    'perl': '<i class="fa-solid fa-p"></i>',
    'r': '<i class="fa-solid fa-r"></i>'
};

// 示例代码
const sampleCodes = {
    'default': '// 开始编码吧！'
};

// 当前打开的所有文件
let openFiles = [{
    name: 'example.py',
    language: 'python',
    content: sampleCodes['python']
}];

// 当前活动的文件索引
let activeFileIndex = 0;

// 添加代码阅读动画效果变量
let codeReadingAnimationInterval = null;
let currentHighlightedLine = 1;

// 加载Monaco编辑器
require(['vs/editor/editor.main'], function() {
    // 尝试从本地存储恢复文件数据
    loadFilesFromStorage();
    
    // 初始化编辑器
    initializeEditor();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 更新界面
    updateUI();
});

// 从localStorage加载文件
function loadFilesFromStorage() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            
            // 恢复文件列表
            if (parsedData.files && Array.isArray(parsedData.files)) {
                openFiles = parsedData.files;
            }
            
            // 恢复活动文件索引
            if (typeof parsedData.activeIndex === 'number' && parsedData.activeIndex >= 0 && parsedData.activeIndex < openFiles.length) {
                activeFileIndex = parsedData.activeIndex;
            } else {
                activeFileIndex = 0; // 默认为第一个文件
            }
            
            // 恢复主题设置
            if (parsedData.theme && (parsedData.theme === 'vs' || parsedData.theme === 'vs-dark')) {
                currentTheme = parsedData.theme;
                if (currentTheme === 'vs-dark') {
                    document.body.classList.add('vs-dark');
                }
            }
            
            // 更新当前语言和文件名
            if (openFiles[activeFileIndex]) {
                currentLanguage = openFiles[activeFileIndex].language;
                currentFileName = openFiles[activeFileIndex].name;
            }
            
            console.log('文件数据已从本地存储恢复');
        }
    } catch (error) {
        console.error('从本地存储恢复文件失败:', error);
        // 恢复失败时使用默认文件
        resetToDefaultFiles();
    }
}

// 保存文件到localStorage
function saveFilesToStorage() {
    try {
        const dataToSave = {
            files: openFiles,
            activeIndex: activeFileIndex,
            theme: currentTheme
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
        console.error('保存文件到本地存储失败:', error);
        showDialog({
            title: '保存失败',
            message: '无法将文件保存到本地存储。可能是存储空间已满或浏览器不支持本地存储。'
        });
    }
}

// 重置为默认文件
function resetToDefaultFiles() {
    openFiles = [{
        name: 'example.py',
        language: 'python',
        content: sampleCodes['default'] || '// 开始编码吧！'
    }];
    activeFileIndex = 0;
    currentLanguage = 'python';
    currentFileName = 'example.py';
}

// 初始化编辑器
function initializeEditor() {
    editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: openFiles[activeFileIndex].content,
        language: openFiles[activeFileIndex].language,
        theme: currentTheme,
        automaticLayout: true,
        fontSize: 14,
        fontFamily: 'JetBrains Mono, monospace',
        fontLigatures: true,
        lineNumbers: 'on',
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        renderLineHighlight: 'all',
        roundedSelection: false,
        cursorStyle: 'line',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        autoIndent: 'full',
        tabSize: 4,
        insertSpaces: true
    });
    
    // 配置自动补全
    setupCompletionProviders();
    
    // 监听编辑器内容变化
    editor.onDidChangeModelContent(() => {
        // 更新当前活动文件的内容
        if (openFiles[activeFileIndex]) {
            openFiles[activeFileIndex].content = editor.getValue();
            
            // 保存到本地存储
            saveFilesToStorage();
        }
    });
    
    // 从本地存储加载文件
    loadFilesFromStorage();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 初始化运行按钮可见性
    updateRunButtonVisibility();
}

// 设置事件监听器
function setupEventListeners() {
    // 主题切换
    document.getElementById('theme-status').addEventListener('click', toggleTheme);
    
    // 新建文件区域双击事件
    document.getElementById('new-file-area').addEventListener('dblclick', createNewFile);
    
    // 新建文件按钮点击事件
    document.getElementById('new-file-button').addEventListener('click', createNewFile);
    
    // AI助手按钮点击事件
    document.getElementById('ai-status').addEventListener('click', () => {
        // 获取当前选中内容
        const selection = editor.getSelection();
        if (selection && !selection.isEmpty()) {
            const selectedCode = editor.getModel().getValueInRange(selection);
            showAiPromptDialog(selection, selectedCode);
        } else {
            // 无选中内容，提示用户需要选择代码
            showDialog({
                title: '请选择代码',
                message: '请先选中需要AI处理的代码段，然后再点击AI辅助编码。'
            });
        }
    });
    
    // 标签关闭按钮点击事件
    document.addEventListener('click', (e) => {
        if (e.target.closest('.tab-close')) {
            const tab = e.target.closest('.tab');
            const index = Array.from(tab.parentElement.children).indexOf(tab) - 0; // -0 因为可能有其他非标签元素在前面
            
            // 显示确认弹窗
            showDialog({
                title: '确认删除',
                message: '确定要永久删除此文件吗，此操作无法恢复',
                showCancel: true,
                okText: '删除',
                cancelText: '取消',
                onOk: () => {
                    closeFile(index);
                }
            });
            
            e.stopPropagation();
        } else if (e.target.closest('.tab')) {
            const tab = e.target.closest('.tab');
            const index = Array.from(tab.parentElement.children).indexOf(tab) - 0;
            activateFile(index);
        }
    });
    
    // 标签栏鼠标滚轮事件，实现水平滚动
    const tabsContainer = document.getElementById('tabs-container');
    tabsContainer.addEventListener('wheel', (e) => {
        // 阻止默认的垂直滚动
        e.preventDefault();
        
        // 将滚轮垂直滚动转换为水平滚动
        // deltaY > 0 向下滚动，对应标签栏向右滚动
        // deltaY < 0 向上滚动，对应标签栏向左滚动
        tabsContainer.scrollLeft += e.deltaY;
    });
    
    // 语言状态点击事件（未实现切换功能，仅显示当前语言）
    document.getElementById('language-status').addEventListener('click', () => {
        // 这里可以添加语言切换功能
        showDialog({
            title: '语言信息',
            message: '当前语言: ' + currentLanguage
        });
    });
    
    // 设置自定义弹窗事件监听器
    setupDialogEventListeners();
    
    // 监听页面关闭事件，确保数据保存
    window.addEventListener('beforeunload', () => {
        saveFilesToStorage();
    });
    
    // 监听键盘快捷键
    document.addEventListener('keydown', (e) => {
        // 如果AI正在处理，阻止编辑操作
        if (window.aiProcessing && 
            !(e.key === 'Escape' || (e.ctrlKey && e.key === 'c'))) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);
    
    // 添加通知按钮点击事件
    document.getElementById('notification').addEventListener('click', () => {
        const noticeContent = `欢迎使用 VeryStupidCode！

使用说明：
1. 文件管理
   - 点击右上角的"+"按钮创建新文件
   - 点击文件标签上的"x"关闭文件
   - 支持多文件同时打开

2. 主题切换
   - 点击底部状态栏的"当前主题"切换明暗主题
   - 支持亮色和暗色两种主题

3. AI 辅助编码
   - 选中需要修改的代码
   - 点击底部状态栏中的"AI 辅助编码"按钮
   - 描述您的需求（例如："优化这段代码"、"增加错误处理"）
   - 可以要求AI添加解释性注释（例如："添加注释解释这段代码的工作原理"）
   - AI将返回完整的修改后代码

4. 运行代码
   - 支持Python、C和HTML代码运行
   - 点击底部状态栏中的运行按钮(▶)
   - Python/C代码可输入参数后运行
   - HTML文件将在新窗口中预览
   - 运行结果由AI模拟输出

5. 快捷键
   - Ctrl + N：新建文件
   - Ctrl + W：关闭当前文件
   - Ctrl + S：保存文件

6. 其他功能
   - 支持语法高亮
   - 支持代码自动补全
   - 支持多语言切换
   - 文件数据自动保存
   - 文件下载功能

注意：所有文件数据都保存在浏览器本地存储中，刷新页面不会丢失。`;

        // 检查是否已存在notice.txt
        const existingFileIndex = openFiles.findIndex(file => file.name === 'notice.txt');
        if (existingFileIndex !== -1) {
            // 如果文件已存在，切换到该文件
            switchFile(existingFileIndex);
        } else {
            // 保存当前文件的状态
            const currentFileContent = editor.getValue();
            const currentFileIndex = activeFileIndex;
            
            // 创建新文件
            const newFile = {
                name: 'notice.txt',
                content: noticeContent,
                language: 'plaintext'
            };
            openFiles.push(newFile);
            const newFileIndex = openFiles.length - 1;
            
            // 创建新的标签
            const tab = document.createElement('div');
            tab.className = 'tab';
            tab.setAttribute('data-language', 'plaintext');
            tab.innerHTML = `
                <span class="tab-icon"><i class="fa-solid fa-file-lines"></i></span>
                <span class="tab-name">notice.txt</span>
                <span class="tab-close"><i class="fa-solid fa-xmark"></i></span>
            `;
            
            // 插入到最后一个标签之前
            const newFileArea = document.querySelector('.new-file-area');
            document.getElementById('tabs-container').insertBefore(tab, newFileArea);
            
            // 切换到新文件
            switchFile(newFileIndex);
            
            // 设置新文件的内容
            editor.setValue(noticeContent);
            
            // 保存到本地存储
            saveFilesToStorage();
        }
    });
    
    // 添加下载按钮点击事件
    document.getElementById('download-button').addEventListener('click', () => {
        // 获取当前文件内容
        const content = editor.getValue();
        const fileName = openFiles[activeFileIndex].name;
        
        // 创建Blob对象
        const blob = new Blob([content], { type: 'text/plain' });
        
        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        
        // 添加到文档中并触发点击
        document.body.appendChild(a);
        a.click();
        
        // 清理
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });
    
    // 添加运行代码按钮事件
    document.getElementById('run-code-button').addEventListener('click', () => {
        // 检查当前文件类型是否支持运行
        const currentFile = openFiles[activeFileIndex];
        const currentLanguage = currentFile.language;
        
        if (['python', 'c', 'cpp', 'javascript', 'html', 'java', 'ruby', 'go', 'php', 'csharp', 'shell', 'rust', 'swift', 'kotlin'].includes(currentLanguage)) {
            runCode();
        } else {
            showDialog({
                title: '不支持的语言',
                message: '目前只支持运行 Python、C、C++、JavaScript、HTML、Java、Ruby、Go、PHP、C#、Shell、Rust、Swift 和 Kotlin 代码。'
            });
        }
    });
}

// 设置自定义弹窗事件监听器
function setupDialogEventListeners() {
    // 关闭按钮
    document.getElementById('dialog-close').addEventListener('click', hideDialog);
    
    // 确定按钮
    document.getElementById('dialog-ok').addEventListener('click', () => {
        // 触发确定回调
        if (window.dialogCallback && typeof window.dialogCallback.onOk === 'function') {
            window.dialogCallback.onOk();
        }
        hideDialog();
    });
    
    // 取消按钮
    document.getElementById('dialog-cancel').addEventListener('click', () => {
        // 触发取消回调
        if (window.dialogCallback && typeof window.dialogCallback.onCancel === 'function') {
            window.dialogCallback.onCancel();
        }
        hideDialog();
    });
    
    // 点击遮罩层关闭
    document.getElementById('custom-dialog-overlay').addEventListener('click', (e) => {
        if (e.target === document.getElementById('custom-dialog-overlay')) {
            // 触发取消回调
            if (window.dialogCallback && typeof window.dialogCallback.onCancel === 'function') {
                window.dialogCallback.onCancel();
            }
            hideDialog();
        }
    });
    
    // ESC键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isDialogVisible()) {
            // 触发取消回调
            if (window.dialogCallback && typeof window.dialogCallback.onCancel === 'function') {
                window.dialogCallback.onCancel();
            }
            hideDialog();
        }
    });
}

// 显示自定义弹窗
function showDialog(options = {}) {
    const { 
        title = '提示', 
        message = '', 
        showCancel = false, 
        okText = '确定', 
        cancelText = '取消',
        onOk,
        onCancel
    } = options;
    
    // 设置标题和内容
    document.getElementById('dialog-title').textContent = title;
    
    // 支持HTML内容
    if (message.includes('<')) {
        document.getElementById('dialog-content').innerHTML = message;
    } else {
        document.getElementById('dialog-content').textContent = message;
    }
    
    // 设置按钮文本
    document.getElementById('dialog-ok').textContent = okText;
    document.getElementById('dialog-cancel').textContent = cancelText;
    
    // 显示/隐藏取消按钮
    document.getElementById('dialog-cancel').style.display = showCancel ? 'block' : 'none';
    
    // 存储回调
    window.dialogCallback = { onOk, onCancel };
    
    // 显示弹窗
    document.getElementById('custom-dialog-overlay').style.display = 'flex';
    
    // 聚焦确定按钮
    document.getElementById('dialog-ok').focus();
}

// 隐藏自定义弹窗
function hideDialog() {
    document.getElementById('custom-dialog-overlay').style.display = 'none';
    
    // 清除回调
    window.dialogCallback = null;
}

// 检查弹窗是否可见
function isDialogVisible() {
    return document.getElementById('custom-dialog-overlay').style.display === 'flex';
}

// 创建新文件
function createNewFile() {
    // 直接创建一个untitled.txt文件
    const untitledFile = {
        name: 'untitled.txt',
        language: 'plaintext',
        content: '请在此行输入文件名，并按下回车创建文件，例如 hello.py'
    };
    
    // 添加到文件列表
    openFiles.push(untitledFile);
    
    // 激活新文件
    activeFileIndex = openFiles.length - 1;
    
    // 更新编辑器和UI
    updateEditorContent();
    updateUI();
    
    // 保存到本地存储
    saveFilesToStorage();
    
    // 设置编辑器焦点
    editor.focus();
    
    // 选中整行文本
    const model = editor.getModel();
    if (model) {
        const lineCount = model.getLineCount();
        const lastLineLength = model.getLineLength(lineCount);
        
        editor.setSelection(new monaco.Range(1, 1, lineCount, lastLineLength + 1));
    }
    
    // 监听编辑器按键事件处理文件名输入
    setupUntitledFileHandling();
}

// 设置新建的untitled文件的特殊处理
function setupUntitledFileHandling() {
    // 移除之前的事件监听器（如果有）
    if (editor._renameFileHandler) {
        editor._renameFileHandler.dispose();
    }
    
    // 添加按键事件监听器
    editor._renameFileHandler = editor.onKeyDown(function(e) {
        // 检查当前文件是否为untitled.txt
        if (currentFileName === 'untitled.txt' && e.keyCode === monaco.KeyCode.Enter) {
            // 获取编辑器内容作为文件名
            const fileName = editor.getValue().trim();
            
            // 简单验证
            if (fileName && fileName !== '请在此行输入文件名，并按下回车创建文件，例如 hello.py') {
                // 创建新文件
                handleUntitledFileRename(fileName);
                
                // 阻止Enter键的默认行为
                e.preventDefault();
                
                // 移除事件监听器
                if (editor._renameFileHandler) {
                    editor._renameFileHandler.dispose();
                    editor._renameFileHandler = null;
                }
            }
        }
    });
}

// 处理untitled文件的重命名
function handleUntitledFileRename(fileName) {
    // 从文件扩展名确定语言
    const ext = fileName.split('.').pop().toLowerCase();
    const language = languageMap[ext] || 'plaintext';
    
    // 更新当前文件
    openFiles[activeFileIndex] = {
        name: fileName,
        language: language,
        content: sampleCodes['default'] || '// 开始编码吧！'
    };
    
    // 更新编辑器和UI
    updateEditorContent();
    updateUI();
    
    // 保存到本地存储
    saveFilesToStorage();
}

// 取消新建文件 - 这个函数不再需要，但保留以防其他地方引用
function cancelNewFile() {
    document.getElementById('untitled-overlay').style.display = 'none';
}

// 确认新建文件 - 这个函数不再需要，但保留以防其他地方引用
function confirmNewFile(fileName) {
    // 从文件扩展名确定语言
    const ext = fileName.split('.').pop().toLowerCase();
    const language = languageMap[ext] || 'plaintext';
    
    // 创建新文件
    openFiles.push({
        name: fileName,
        language: language,
        content: sampleCodes['default'] || '// 开始编码吧！'
    });
    
    // 激活新文件
    activeFileIndex = openFiles.length - 1;
    
    // 隐藏覆盖层
    document.getElementById('untitled-overlay').style.display = 'none';
    
    // 更新编辑器和UI
    updateEditorContent();
    updateUI();
    
    // 保存到本地存储
    saveFilesToStorage();
}

// 关闭文件
function closeFile(index) {
    // 如果只有一个文件，则不允许关闭
    if (openFiles.length === 1) {
        showDialog({
            title: '无法关闭',
            message: '至少保留一个文件！'
        });
        return;
    }
    
    // 移除文件
    openFiles.splice(index, 1);
    
    // 更新当前活动文件索引
    if (activeFileIndex >= index) {
        activeFileIndex = Math.max(0, activeFileIndex - 1);
    }
    
    // 更新编辑器和UI
    updateEditorContent();
    updateUI();
    
    // 保存到本地存储
    saveFilesToStorage();
}

// 激活文件
function activateFile(index) {
    activeFileIndex = index;
    updateEditorContent();
    updateUI();
    
    // 保存到本地存储
    saveFilesToStorage();
}

// 更新编辑器内容
function updateEditorContent() {
    const activeFile = openFiles[activeFileIndex];
    if (activeFile) {
        const model = monaco.editor.createModel(
            activeFile.content,
            activeFile.language
        );
        editor.setModel(model);
        currentLanguage = activeFile.language;
        currentFileName = activeFile.name;
    }
}

// 更新UI
function updateUI() {
    // 更新标签栏
    updateTabs();
    
    // 更新语言状态
    updateLanguageStatus();
    
    // 更新运行按钮显示
    updateRunButtonVisibility();
}

// 更新标签栏
function updateTabs() {
    const tabsContainer = document.getElementById('tabs-container');
    
    // 清除现有标签（除了新建文件区域）
    const newFileArea = document.getElementById('new-file-area');
    tabsContainer.innerHTML = '';
    tabsContainer.appendChild(newFileArea);
    
    // 添加文件标签
    openFiles.forEach((file, index) => {
        const tab = document.createElement('div');
        tab.className = 'tab' + (index === activeFileIndex ? ' active' : '');
        tab.setAttribute('data-language', file.language);
        
        const icon = languageIcons[file.language] || '<i class="fa-solid fa-file-code"></i>';
        
        tab.innerHTML = `
            <span class="tab-icon">${icon}</span>
            <span class="tab-name">${file.name}</span>
            <span class="tab-close"><i class="fa-solid fa-xmark"></i></span>
        `;
        
        tabsContainer.insertBefore(tab, newFileArea);
    });
}

// 更新语言状态
function updateLanguageStatus() {
    const languageStatus = document.getElementById('language-status');
    
    // 首字母大写
    const displayLanguage = currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1);
    
    languageStatus.textContent = displayLanguage;
}

// 切换主题函数
function toggleTheme() {
    if (currentTheme === 'vs') {
        currentTheme = 'vs-dark';
        document.body.classList.add('vs-dark');
    } else {
        currentTheme = 'vs';
        document.body.classList.remove('vs-dark');
    }
    
    monaco.editor.setTheme(currentTheme);
    const themeText = currentTheme === 'vs' ? '当前主题: 亮色' : '当前主题: 暗色';
    document.getElementById('theme-status').innerHTML = `<span class="icon">&#9681;</span>${themeText}`;
    
    // 保存主题设置到本地存储
    saveFilesToStorage();
}

// 设置自动补全提供程序
function setupCompletionProviders() {
    // Python自动补全
    registerPythonCompletionProvider();
    
    // C语言自动补全
    registerCCompletionProvider();
    
    // HTML自动补全
    registerHTMLCompletionProvider();
}

// 注册Python自动补全提供程序
function registerPythonCompletionProvider() {
    // Python补全建议
    const pythonSuggestions = [
        {
            label: 'print',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'print(${1:value})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '输出内容到控制台'
        },
        {
            label: 'def',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'def ${1:function_name}(${2:parameters}):\n\t${3:pass}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '定义一个函数'
        },
        {
            label: 'class',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'class ${1:ClassName}:\n\tdef __init__(self, ${2:parameters}):\n\t\t${3:pass}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '定义一个类'
        },
        {
            label: 'if',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'if ${1:condition}:\n\t${2:pass}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '条件语句'
        },
        {
            label: 'for',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'for ${1:item} in ${2:iterable}:\n\t${3:pass}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '循环语句'
        },
        {
            label: 'while',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'while ${1:condition}:\n\t${2:pass}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '循环语句'
        },
        {
            label: 'import',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'import ${1:module}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '导入模块'
        },
        {
            label: 'from',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'from ${1:module} import ${2:name}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '从模块导入特定内容'
        },
        {
            label: 'try',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:e}:\n\t${4:pass}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '异常处理'
        },
        {
            label: 'lambda',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'lambda ${1:args}: ${2:expression}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '匿名函数'
        },
        {
            label: 'list',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'list(${1:iterable})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '创建列表'
        },
        {
            label: 'dict',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'dict(${1:iterable})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '创建字典'
        }
    ];

    // 注册Python自动补全提供程序
    monaco.languages.registerCompletionItemProvider('python', {
        provideCompletionItems: function(model, position) {
            // 获取当前行的文本内容
            const textUntilPosition = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });
            
            // 获取当前输入的单词
            const word = textUntilPosition.match(/[a-zA-Z0-9_]*$/)[0];
            
            // 如果没有正在输入的单词，则返回所有建议
            if (!word) {
                return { suggestions: pythonSuggestions };
            }
            
            // 根据当前输入的单词过滤建议
            const filteredSuggestions = pythonSuggestions.filter(suggestion => 
                suggestion.label.toLowerCase().startsWith(word.toLowerCase())
            );
            
            return {
                suggestions: filteredSuggestions.map(s => ({
                    ...s,
                    // 确保补全内容从当前单词开始位置替换
                    range: {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column - word.length,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column
                    }
                }))
            };
        },
        // 设置触发字符，当输入这些字符时会触发补全
        triggerCharacters: ['.',',','(','=','[','{',':','d','f','p','i','c','w','t','l']
    });
}

// 注册C语言自动补全提供程序
function registerCCompletionProvider() {
    // C语言补全建议
    const cSuggestions = [
        {
            label: 'if',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'if (${1:condition}) {\n\t${2}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '条件语句'
        },
        {
            label: 'for',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'for (${1:int i = 0}; ${2:i < n}; ${3:i++}) {\n\t${4}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '循环语句'
        },
        {
            label: 'while',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'while (${1:condition}) {\n\t${2}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '循环语句'
        },
        {
            label: 'switch',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'switch (${1:expression}) {\n\tcase ${2:value}:\n\t\t${3}\n\t\tbreak;\n\tdefault:\n\t\t${4}\n\t\tbreak;\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '分支语句'
        },
        {
            label: 'printf',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'printf("${1:%s}\\n"${1:, ${2:value}});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '打印到标准输出'
        },
        {
            label: 'scanf',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'scanf("${1:%d}", &${2:value});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '从标准输入读取'
        },
        {
            label: 'include',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '#include <${1:stdio.h}>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '包含头文件'
        },
        {
            label: 'main',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'int main() {\n\t${1}\n\treturn 0;\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '主函数'
        },
        {
            label: 'function',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '${1:void} ${2:function_name}(${3:parameters}) {\n\t${4}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '函数定义'
        },
        {
            label: 'struct',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'struct ${1:name} {\n\t${2:int member};\n};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '结构体定义'
        }
    ];

    // 注册C自动补全提供程序
    monaco.languages.registerCompletionItemProvider('c', {
        provideCompletionItems: function(model, position) {
            const textUntilPosition = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });
            
            const word = textUntilPosition.match(/[a-zA-Z0-9_]*$/)[0];
            
            if (!word) {
                return { suggestions: cSuggestions };
            }
            
            const filteredSuggestions = cSuggestions.filter(suggestion => 
                suggestion.label.toLowerCase().startsWith(word.toLowerCase())
            );
            
            return {
                suggestions: filteredSuggestions.map(s => ({
                    ...s,
                    range: {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column - word.length,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column
                    }
                }))
            };
        },
        triggerCharacters: ['.',',','(','#','<','{','i','f','w','s','p','m']
    });
}

// 注册HTML自动补全提供程序
function registerHTMLCompletionProvider() {
    // HTML补全建议
    const htmlSuggestions = [
        {
            label: '!doctype',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<!DOCTYPE html>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'HTML5文档类型'
        },
        {
            label: 'html',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<html>\n\t${1}\n</html>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'HTML根元素'
        },
        {
            label: 'head',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<head>\n\t${1}\n</head>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'HTML头部'
        },
        {
            label: 'body',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<body>\n\t${1}\n</body>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'HTML主体'
        },
        {
            label: 'div',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<div${1: class="${2:className}"}>\n\t${3}\n</div>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '块级元素'
        },
        {
            label: 'span',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<span${1: class="${2:className}"}>${3}</span>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '内联元素'
        },
        {
            label: 'h1',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<h1>${1}</h1>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '标题1'
        },
        {
            label: 'p',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<p>${1}</p>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '段落'
        },
        {
            label: 'a',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<a href="${1:#}">${2:链接文本}</a>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '超链接'
        },
        {
            label: 'img',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<img src="${1}" alt="${2}" />',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '图片'
        },
        {
            label: 'input',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<input type="${1:text}" placeholder="${2}" />',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '输入框'
        },
        {
            label: 'button',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<button type="${1:button}">${2:按钮文本}</button>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '按钮'
        },
        {
            label: 'form',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<form action="${1:#}" method="${2:post}">\n\t${3}\n</form>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '表单'
        },
        {
            label: 'link',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<link rel="stylesheet" href="${1:styles.css}" />',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '外部样式表链接'
        },
        {
            label: 'script',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<script src="${1}"></script>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '外部脚本链接'
        }
    ];

    // 注册HTML自动补全提供程序
    monaco.languages.registerCompletionItemProvider('html', {
        provideCompletionItems: function(model, position) {
            const textUntilPosition = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });
            
            const word = textUntilPosition.match(/[a-zA-Z0-9_!]*$/)[0];
            
            if (!word) {
                return { suggestions: htmlSuggestions };
            }
            
            const filteredSuggestions = htmlSuggestions.filter(suggestion => 
                suggestion.label.toLowerCase().startsWith(word.toLowerCase())
            );
            
            return {
                suggestions: filteredSuggestions.map(s => ({
                    ...s,
                    range: {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column - word.length,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column
                    }
                }))
            };
        },
        triggerCharacters: ['<','!','/']
    });
}

// 显示AI提示弹窗
function showAiPromptDialog(selection, selectedCode) {
    // 创建输入框HTML
    const inputHtml = `
        <div style="margin-bottom: 10px;">请描述您需要AI协助的内容：</div>
        <textarea id="ai-prompt-input" style="width: 100%; height: 80px; padding: 8px; box-sizing: border-box; border: 1px solid ${currentTheme === 'vs' ? '#ccc' : '#3c3c3c'}; border-radius: 3px; background-color: ${currentTheme === 'vs' ? '#fff' : '#1e1e1e'}; color: ${currentTheme === 'vs' ? '#333' : '#ccc'}; font-family: 'JetBrains Mono', monospace; resize: none;"></textarea>
    `;
    
    // 显示带输入框的对话框
    showDialog({
        title: 'AI 辅助编码',
        message: inputHtml,
        showCancel: true,
        okText: '生成代码',
        cancelText: '取消',
        onOk: () => {
            const promptElement = document.getElementById('ai-prompt-input');
            if (promptElement) {
                const prompt = promptElement.value.trim();
                if (prompt) {
                    // 获取原始模型
                    const originalModel = editor.getModel();
                    const completeCode = originalModel.getValue();
                    
                    // 设置全局标志
                    window.aiProcessing = true;
                    
                    // 临时设置编辑器模型为只读
                    originalModel.updateOptions({ readOnly: true });
                    
                    // 添加Visual指示器，表明AI正在处理
                    document.body.classList.add('ai-processing');
                    
                    // 在AI处理过程中禁用某些界面元素
                    disableUIElementsDuringAIProcessing(true);
                    
                    // 发送给AI处理
                    processAiRequest(prompt, selectedCode, selection, completeCode, originalModel);
                }
            }
        }
    });
    
    // 聚焦输入框
    setTimeout(() => {
        const promptElement = document.getElementById('ai-prompt-input');
        if (promptElement) {
            promptElement.focus();
        }
    }, 100);
}

// 禁用/启用UI元素
function disableUIElementsDuringAIProcessing(disable) {
    // 获取可以在AI处理过程中禁用的元素
    const elementsToDisable = [
        document.getElementById('new-file-button'),
        document.getElementById('notification')
    ];
    
    // 禁用/启用这些元素
    elementsToDisable.forEach(el => {
        if (el) {
            if (disable) {
                el.setAttribute('data-original-style', el.style.pointerEvents || '');
                el.style.pointerEvents = 'none';
                el.style.opacity = '0.5';
            } else {
                el.style.pointerEvents = el.getAttribute('data-original-style') || '';
                el.style.opacity = '';
                el.removeAttribute('data-original-style');
            }
        }
    });
    
    // 禁用标签栏的关闭按钮
    const closeButtons = document.querySelectorAll('.tab-close');
    if (closeButtons) {
        closeButtons.forEach(btn => {
            if (disable) {
                btn.setAttribute('data-original-style', btn.style.pointerEvents || '');
                btn.style.pointerEvents = 'none';
                btn.style.opacity = '0.5';
            } else {
                btn.style.pointerEvents = btn.getAttribute('data-original-style') || '';
                btn.style.opacity = '';
                btn.removeAttribute('data-original-style');
            }
        });
    }
    
    // 为编辑器添加视觉提示，但允许鼠标操作
    const editorContainer = document.getElementById('editor-container');
    if (editorContainer) {
        if (disable) {
            editorContainer.style.position = 'relative';
            // 移除遮罩层
            let existingOverlay = document.getElementById('ai-processing-overlay');
            if (!existingOverlay) {
                const overlay = document.createElement('div');
                overlay.id = 'ai-processing-overlay';
                overlay.style.position = 'absolute';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.right = '0';
                overlay.style.bottom = '0';
                overlay.style.zIndex = '10';
                overlay.style.pointerEvents = 'none'; // 允许鼠标操作
                
                editorContainer.appendChild(overlay);
            }
            
            // 启动代码阅读动画
            startCodeReadingAnimation();
        } else {
            const overlay = document.getElementById('ai-processing-overlay');
            if (overlay) {
                editorContainer.removeChild(overlay);
            }
            
            // 停止代码阅读动画
            stopCodeReadingAnimation();
        }
    }
}

// 启动代码阅读动画
function startCodeReadingAnimation() {
    // 确保停止任何现有的动画
    stopCodeReadingAnimation();
    
    // 获取当前编辑器模型
    const model = editor.getModel();
    if (!model) return;
    
    // 获取总行数
    const lineCount = model.getLineCount();
    if (lineCount <= 0) return;
    
    // 重置当前高亮行
    currentHighlightedLine = 1;
    
    // 创建动画间隔
    codeReadingAnimationInterval = setInterval(() => {
        // 清除所有之前的装饰
        editor.deltaDecorations([], []);
        
        // 创建新的装饰 - 主行和前后行的梯度效果
        const decorations = [];
        
        // 当前行 - 主要高亮
        decorations.push({
            range: new monaco.Range(currentHighlightedLine, 1, currentHighlightedLine, model.getLineMaxColumn(currentHighlightedLine)),
            options: {
                isWholeLine: true,
                className: currentTheme === 'vs' ? 'code-reading-highlight-light' : 'code-reading-highlight-dark'
            }
        });
        
        // 前一行 - 淡化高亮
        if (currentHighlightedLine > 1) {
            decorations.push({
                range: new monaco.Range(currentHighlightedLine - 1, 1, currentHighlightedLine - 1, model.getLineMaxColumn(currentHighlightedLine - 1)),
                options: {
                    isWholeLine: true,
                    className: currentTheme === 'vs' ? 'code-reading-highlight-light-fade' : 'code-reading-highlight-dark-fade'
                }
            });
        }
        
        // 后一行 - 淡化高亮
        if (currentHighlightedLine < lineCount) {
            decorations.push({
                range: new monaco.Range(currentHighlightedLine + 1, 1, currentHighlightedLine + 1, model.getLineMaxColumn(currentHighlightedLine + 1)),
                options: {
                    isWholeLine: true,
                    className: currentTheme === 'vs' ? 'code-reading-highlight-light-fade' : 'code-reading-highlight-dark-fade'
                }
            });
        }
        
        // 应用装饰
        editor.deltaDecorations([], decorations);
        
        // 确保高亮行在视图中可见，使用平滑滚动
        editor.revealLineInCenterIfOutsideViewport(currentHighlightedLine, monaco.editor.ScrollType.Smooth);
        
        // 移动到下一行，如果到达末尾则重新开始
        currentHighlightedLine++;
        if (currentHighlightedLine > lineCount) {
            currentHighlightedLine = 1;
        }
    }, 150); // 调整为每150毫秒高亮下一行，稍微放慢速度使效果更明显
}

// 停止代码阅读动画
function stopCodeReadingAnimation() {
    if (codeReadingAnimationInterval) {
        clearInterval(codeReadingAnimationInterval);
        codeReadingAnimationInterval = null;
        
        // 清除所有装饰
        if (editor) {
            editor.deltaDecorations([], []);
        }
    }
}

// 处理AI请求
function processAiRequest(prompt, selectedCode, selection, completeCode, originalModel) {
    // 更新底部状态栏显示为"正在生成"
    const aiStatusElement = document.getElementById('ai-status');
    const originalAiStatusText = aiStatusElement.innerHTML;
    aiStatusElement.innerHTML = '正在生成';
    
    // 获取选中区域的行范围
    const startLine = selection.startLineNumber;
    const endLine = selection.endLineNumber;
    
    // 构建请求体
    const requestBody = {
        model: AI_CONFIG.model,
        messages: [
            {
                role: "system",
                content: `你是一个代码助手。用户将提供完整的代码文件，其中某些部分被标记为"// --- 选中的代码开始 ---"和"// --- 选中的代码结束 ---"。
用户会告诉你他想要如何修改这部分代码。你的任务是：
1. 理解用户的需求
2. 生成完整的修改后代码
3. 返回修改后的完整代码文件

若用户要求解释代码或添加说明，请使用代码注释来提供解释。根据编程语言选择合适的注释格式：

请直接返回完整的代码，不要包含任何额外的解释或说明。
不要使用 Markdown 代码块标记（\`\`\`），直接返回代码。`
            },
            {
                role: "user",
                content: `我正在编写${currentLanguage}代码。以下是我的完整代码，我已经标记了我想要修改的部分：

${completeCode.substring(0, originalModel.getOffsetAt({lineNumber: startLine, column: 1}))}// --- 选中的代码开始 ---
${selectedCode}
// --- 选中的代码结束 ---${completeCode.substring(originalModel.getOffsetAt({lineNumber: endLine, column: originalModel.getLineMaxColumn(endLine)}))}

我想要：${prompt}

请直接返回修改后的完整代码文件，不要包含任何其他解释。一定不要使用 Markdown 代码块包裹代码，直接输出代码。`
            }
        ],
        temperature: 0.7
    };
    
    // 发送请求
    fetch(AI_CONFIG.baseUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_CONFIG.apiKey}`
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP错误：${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // 提取AI回复
        if (data.choices && data.choices.length > 0) {
            const aiCode = data.choices[0].message.content.trim();
            
            // 停止代码阅读动画
            stopCodeReadingAnimation();
            
            // 直接替换编辑器内容
            editor.setValue(aiCode);
        } else {
            throw new Error('未收到有效的AI回复');
        }
    })
    .catch(error => {
        console.error('AI请求错误:', error);
        
        // 仅在出错时显示提示对话框
        showDialog({
            title: '请求失败',
            message: `AI请求失败：${error.message}`
        });
    })
    .finally(() => {
        // 恢复状态栏文本
        aiStatusElement.innerHTML = originalAiStatusText;
        
        // 无论成功或失败，恢复编辑器状态
        originalModel.updateOptions({ readOnly: false });
        
        // 恢复UI元素
        disableUIElementsDuringAIProcessing(false);
        
        // 移除处理标志和视觉指示
        window.aiProcessing = false;
        document.body.classList.remove('ai-processing');
        
        // 确保停止代码阅读动画
        stopCodeReadingAnimation();
    });
}

// 运行代码功能
function runCode() {
    // 获取当前文件信息
    const currentFile = openFiles[activeFileIndex];
    const currentLanguage = currentFile.language;
    
    // 扩展支持运行的语言
    const runnableLanguages = ['python', 'c', 'cpp', 'javascript', 'html', 'java', 'ruby', 'go', 'php', 'csharp', 'shell', 'rust', 'swift', 'kotlin'];
    
    // 只支持指定语言
    if (!runnableLanguages.includes(currentLanguage)) {
        showDialog({
            title: '不支持的语言',
            message: '目前只支持运行 Python、C、C++、JavaScript、HTML、Java、Ruby、Go、PHP、C#、Shell、Rust、Swift 和 Kotlin 代码。'
        });
        return;
    }
    
    // 获取当前代码
    const code = editor.getValue();
    
    // 处理HTML直接显示
    if (currentLanguage === 'html') {
        // 创建一个新窗口并显示HTML
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(code);
            newWindow.document.close();
        } else {
            showDialog({
                title: '无法预览',
                message: '浏览器阻止了弹出窗口，请允许弹出窗口后重试。'
            });
        }
        return;
    }
    
    // 对于其他代码，显示输入提示对话框
    const inputHtml = `
        <div style="margin-bottom: 10px;">如有输入，请在此进行输入（每行一个）：</div>
        <textarea id="code-input" style="width: 100%; height: 80px; padding: 8px; box-sizing: border-box; border: 1px solid ${currentTheme === 'vs' ? '#ccc' : '#3c3c3c'}; border-radius: 3px; background-color: ${currentTheme === 'vs' ? '#fff' : '#1e1e1e'}; color: ${currentTheme === 'vs' ? '#333' : '#ccc'}; font-family: 'JetBrains Mono', monospace; resize: none;"></textarea>
    `;
    
    showDialog({
        title: '运行代码',
        message: inputHtml,
        showCancel: true,
        okText: '运行',
        cancelText: '取消',
        onOk: () => {
            const inputElement = document.getElementById('code-input');
            let userInput = '';
            if (inputElement) {
                userInput = inputElement.value.trim();
            }
            
            // 显示加载状态
            const runButton = document.getElementById('run-code-button');
            const originalInnerHTML = runButton.innerHTML;
            runButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            
            // 发送到AI执行代码
            executeCodeWithAI(code, currentLanguage, userInput)
                .then(result => {
                    // 显示结果
                    showCodeExecutionResult(result);
                })
                .catch(error => {
                    showDialog({
                        title: '执行失败',
                        message: `运行代码时发生错误：${error.message}`
                    });
                })
                .finally(() => {
                    // 恢复按钮状态
                    runButton.innerHTML = originalInnerHTML;
                });
        }
    });
}

// 使用AI执行代码
async function executeCodeWithAI(code, language, userInput) {
    // 构建请求体
    const prompt = getExecutionPrompt(code, language, userInput);
    
    const requestBody = {
        model: AI_CONFIG.model,
        messages: [
            {
                role: "system",
                content: prompt.system
            },
            {
                role: "user",
                content: prompt.user
            }
        ],
        temperature: 0.2
    };
    
    // 发送请求
    const response = await fetch(AI_CONFIG.baseUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_CONFIG.apiKey}`
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP错误：${response.status}`);
    }
    
    const data = await response.json();
    
    // 提取AI回复
    if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content.trim();
    } else {
        throw new Error('未收到有效的AI回复');
    }
}

// 获取执行代码的提示词
function getExecutionPrompt(code, language, userInput) {
    // 基础系统提示
    let systemPrompt = `你是一个代码执行引擎，专门执行${language}代码并返回运行结果。
你的任务是：
1. 解析用户提供的代码
2. 执行代码（如有用户输入，使用提供的输入）
3. 返回执行结果

请遵循以下规则：
- 只返回代码的实际输出结果
- 不要包含解释、分析或额外评论
- 如果代码有错误，返回详细的错误信息
- 格式应简洁清晰，与真实编译器/解释器输出一致`;

    // 根据不同语言添加特定提示
    const languageSpecificPrompts = {
        'python': `\n\n对于Python代码：
- 模拟Python 3.9解释器的行为
- 支持标准库函数
- 处理print()输出、异常和标准输入`,
        'c': `\n\n对于C代码：
- 模拟gcc编译器的行为
- 支持标准C库函数
- 处理printf()输出、编译错误和运行时错误
- 支持命令行参数和标准输入`,
        'cpp': `\n\n对于C++代码：
- 模拟g++编译器的行为
- 支持标准C++库函数和STL
- 处理cout输出、编译错误和运行时错误`,
        'javascript': `\n\n对于JavaScript代码：
- 模拟Node.js环境
- 支持ES6+特性
- 处理console.log输出和异常`,
        'java': `\n\n对于Java代码：
- 模拟JDK环境
- 支持Java标准库
- 处理System.out.println输出和异常`,
        'ruby': `\n\n对于Ruby代码：
- 模拟Ruby解释器
- 处理puts输出和异常`,
        'go': `\n\n对于Go代码：
- 模拟Go编译器和运行时
- 处理fmt.Println输出和错误`,
        'php': `\n\n对于PHP代码：
- 模拟PHP解释器
- 处理echo/print输出和错误`,
        'csharp': `\n\n对于C#代码：
- 模拟.NET环境
- 处理Console.WriteLine输出和异常`,
        'shell': `\n\n对于Shell脚本：
- 模拟Bash环境
- 处理命令输出和错误`,
        'rust': `\n\n对于Rust代码：
- 模拟Rust编译器
- 处理println!输出和错误`,
        'swift': `\n\n对于Swift代码：
- 模拟Swift编译器
- 处理print输出和错误`,
        'kotlin': `\n\n对于Kotlin代码：
- 模拟Kotlin JVM环境
- 处理println输出和异常`
    };

    // 添加特定语言的提示（如果存在）
    if (languageSpecificPrompts[language]) {
        systemPrompt += languageSpecificPrompts[language];
    }

    // 用户提示（包含代码和输入）
    let userPrompt = `请执行以下${language}代码：\n\n\`\`\`${language}\n${code}\n\`\`\``;
    
    if (userInput) {
        userPrompt += `\n\n用户输入（每行一个）：\n${userInput}`;
    }
    
    return {
        system: systemPrompt,
        user: userPrompt
    };
}

// 显示代码执行结果
function showCodeExecutionResult(result) {
    // 创建结果弹窗
    const resultHtml = `
        <div style="margin-bottom: 10px;">执行结果：</div>
        <pre style="width: 100%; max-height: 300px; padding: 8px; box-sizing: border-box; border: 1px solid ${currentTheme === 'vs' ? '#ccc' : '#3c3c3c'}; border-radius: 3px; background-color: ${currentTheme === 'vs' ? '#f5f5f5' : '#1e1e1e'}; color: ${currentTheme === 'vs' ? '#333' : '#ccc'}; font-family: 'JetBrains Mono', monospace; overflow: auto; white-space: pre-wrap;">${result}</pre>
    `;
    
    showDialog({
        title: '代码执行结果',
        message: resultHtml,
        showCancel: false,
        okText: '关闭'
    });
}

// 更新运行按钮显示状态
function updateRunButtonVisibility() {
    const runButton = document.getElementById('run-code-button');
    if (runButton) {
        const currentFile = openFiles[activeFileIndex];
        const currentLanguage = currentFile.language;
        
        // 扩展支持运行的语言列表
        const runnableLanguages = ['python', 'c', 'cpp', 'javascript', 'html', 'java', 'ruby', 'go', 'php', 'csharp', 'shell', 'rust', 'swift', 'kotlin'];
        
        if (runnableLanguages.includes(currentLanguage)) {
            runButton.style.display = 'flex';
        } else {
            runButton.style.display = 'none';
        }
    }
}

// 切换到指定文件
function switchFile(index) {
    if (index >= 0 && index < openFiles.length) {
        // 更新activeFileIndex
        activeFileIndex = index;
        
        // 更新编辑器内容和语言
        editor.setValue(openFiles[index].content);
        monaco.editor.setModelLanguage(editor.getModel(), openFiles[index].language);
        
        // 更新标签样式
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach((tab, i) => {
            if (i === index) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // 更新语言状态
        updateLanguageStatus();
        
        // 更新运行按钮显示
        updateRunButtonVisibility();
        
        // 保存到本地存储
        saveFilesToStorage();
    }
} 