// 配置Monaco Editor的加载路径
require.config({
    paths: {
        'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.0/min/vs'
    }
});

// AI配置
const AI_CONFIG = {
    apiKey: 'sk-91g5VZZfJOOVlm9OppDT3GrMk0T5qlSFboEOMZamiKIaEvJg',
    baseUrl: 'https://api.gptgod.online/v1/chat/completions',
    model: 'gpt-4o-mini'
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
    'html': 'html',
    'htm': 'html'
};

// 语言和图标映射
const languageIcons = {
    'python': '<i class="fa-brands fa-python"></i>',
    'c': '<i class="fa-solid fa-copyright"></i>',
    'html': '<i class="fa-brands fa-html5"></i>'
};

// 示例代码
const sampleCodes = {
    'python': `def greeting(name):
    """
    一个简单的问候函数
    """
    return f"你好，{name}！"

# 测试函数
message = greeting("世界")
print(message)

class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def introduce(self):
        return f"我叫{self.name}，今年{self.age}岁"
`,
    'c': `#include <stdio.h>

/**
 * 一个简单的问候函数
 */
void greeting(const char* name) {
    printf("你好，%s！\\n", name);
}

int main() {
    // 测试函数
    greeting("世界");
    
    return 0;
}`,
    'html': `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML示例</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            color: #333;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>你好，世界！</h1>
        <p>这是一个简单的HTML示例页面。</p>
    </div>
</body>
</html>`
};

// 当前打开的所有文件
let openFiles = [{
    name: 'example.py',
    language: 'python',
    content: sampleCodes['python']
}];

// 当前活动的文件索引
let activeFileIndex = 0;

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
        content: sampleCodes['python']
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
        showDialog({
            title: 'AI助手使用方法',
            message: '选中代码后，在右键菜单中点击"AI 辅助编码"选项，输入您的需求，AI将生成相应代码并插入到合适位置。'
        });
    });
    
    // 添加AI辅助编码到编辑器的右键菜单
    editor.addAction({
        id: 'ai-assistant',
        label: 'AI 辅助编码',
        keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyA],
        contextMenuGroupId: '1_modification',
        contextMenuOrder: 1.5,
        run: function(ed) {
            const selection = ed.getSelection();
            if (selection && !selection.isEmpty()) {
                const selectedCode = ed.getModel().getValueInRange(selection);
                showAiPromptDialog(selection, selectedCode);
            } else {
                showDialog({
                    title: '无法执行',
                    message: '请先选中要处理的代码'
                });
            }
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
    
    // 添加键盘快捷键监听
    document.addEventListener('keydown', (e) => {
        // 如果AI正在处理，阻止编辑操作
        if (window.aiProcessing && 
            !(e.key === 'Escape' || (e.ctrlKey && e.key === 'c'))) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);
    
    // 阻止在AI处理过程中的鼠标操作
    document.addEventListener('mousedown', (e) => {
        if (window.aiProcessing && 
            !e.target.closest('#dialog-ok') && 
            !e.target.closest('#dialog-cancel') && 
            !e.target.closest('#dialog-close')) {
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
   - 选中代码后右键，选择"AI 辅助编码"
   - 在对话框中输入您的需求
   - 支持代码插入和删除操作
   - 示例：
     * "在第3行插入打印语句"
     * "删除第5-7行的代码"
     * "在第2行插入一个for循环"

4. 快捷键
   - Ctrl + N：新建文件
   - Ctrl + W：关闭当前文件
   - Alt + A：打开AI辅助编码
   - Ctrl + S：保存文件

5. 其他功能
   - 支持语法高亮
   - 支持代码自动补全
   - 支持多语言切换
   - 文件数据自动保存

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
        content: sampleCodes[language] || ''
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
        content: sampleCodes[language] || ''
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
        <div style="margin-bottom: 10px;">请输入您的需求，可指定操作类型：</div>
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
                    
                    // 设置全局标志和备份当前状态
                    window.aiProcessing = true;
                    
                    // 临时设置编辑器模型为只读
                    originalModel.updateOptions({ readOnly: true });
                    
                    // 添加Visual指示器，表明AI正在处理
                    document.body.classList.add('ai-processing');
                    
                    // 在AI处理过程中禁用某些界面元素
                    disableUIElementsDuringAIProcessing(true);
                    
                    // 发送给AI处理
                    processAiRequest(prompt, selectedCode, selection, originalModel);
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
        document.getElementById('theme-status'),
        document.getElementById('language-status')
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
    
    // 禁用/启用标签栏
    const tabsContainer = document.getElementById('tabs-container');
    if (tabsContainer) {
        if (disable) {
            tabsContainer.setAttribute('data-original-style', tabsContainer.style.pointerEvents || '');
            tabsContainer.style.pointerEvents = 'none';
            tabsContainer.style.opacity = '0.7';
        } else {
            tabsContainer.style.pointerEvents = tabsContainer.getAttribute('data-original-style') || '';
            tabsContainer.style.opacity = '';
            tabsContainer.removeAttribute('data-original-style');
        }
    }
}

// 处理AI请求
function processAiRequest(prompt, selectedCode, selection, originalModel) {
    // 显示加载状态
    showDialog({
        title: 'AI处理中',
        message: '正在处理您的请求，请稍候...'
    });
    
    // 获取选中区域的行范围
    const startLine = selection.startLineNumber;
    const endLine = selection.endLineNumber;
    
    // 构建请求体
    const requestBody = {
        model: AI_CONFIG.model,
        messages: [
            {
                role: "system",
                content: `你是一个代码助手，你的任务是根据用户的要求对代码进行修改。你可以执行两种操作：插入代码和删除代码。

请使用以下格式回复：

1. 对于插入代码，使用：
INSERT:<行号>
代码内容

2. 对于删除代码，使用：
DELETE:<起始行>-<结束行>

例如：
- 如果用户要求在第3行插入print语句，你应返回：
INSERT:3
print("Hello World")

- 如果用户要求删除第5行代码，你应返回：
DELETE:5-5

- 如果用户要求删除第5到8行代码，你应返回：
DELETE:5-8

如果需要多个操作，可以组合使用上述格式。请不要包含任何解释或说明，只返回带操作前缀的代码。`
            },
            {
                role: "user",
                content: `我正在编写${currentLanguage}代码，这是我当前的代码：

\`\`\`${currentLanguage}
${selectedCode}
\`\`\`

选中代码的起始行是第${startLine}行，结束行是第${endLine}行。

我的要求是：${prompt}

请按照INSERT:<行号>或DELETE:<起始行>-<结束行>格式返回，不要有任何解释。`
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
        // 隐藏加载对话框
        hideDialog();
        
        // 提取AI回复
        if (data.choices && data.choices.length > 0) {
            const aiCode = data.choices[0].message.content.trim();
            
            // 解析并应用AI生成的代码修改
            processAiCodeOperations(aiCode, originalModel, selection);
        } else {
            throw new Error('未收到有效的AI回复');
        }
    })
    .catch(error => {
        console.error('AI请求错误:', error);
        hideDialog();
        
        showDialog({
            title: '请求失败',
            message: `AI请求失败：${error.message}`
        });
    })
    .finally(() => {
        // 无论成功或失败，恢复编辑器状态
        originalModel.updateOptions({ readOnly: false });
        
        // 恢复UI元素
        disableUIElementsDuringAIProcessing(false);
        
        // 移除处理标志和视觉指示
        window.aiProcessing = false;
        document.body.classList.remove('ai-processing');
    });
}

// 处理AI代码操作（插入和删除）
function processAiCodeOperations(aiResponse, model, selection) {
    try {
        // 解析AI响应中的操作指令
        const insertPattern = /^INSERT:(\d+)\s*$/i;
        const deletePattern = /^DELETE:(\d+)-(\d+)\s*$/i;
        const lines = aiResponse.split('\n');
        
        // 存储操作
        const operations = [];
        let currentOperation = null;
        let currentCode = [];
        
        // 解析每一行
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const insertMatch = line.match(insertPattern);
            const deleteMatch = line.match(deletePattern);
            
            if (insertMatch) {
                // 如果已经有操作，添加到结果中
                if (currentOperation && currentOperation.type === 'INSERT' && currentCode.length > 0) {
                    operations.push({
                        type: 'INSERT',
                        lineNumber: currentOperation.lineNumber,
                        code: currentCode.join('\n')
                    });
                    currentCode = [];
                }
                
                // 设置新的插入操作
                currentOperation = {
                    type: 'INSERT',
                    lineNumber: parseInt(insertMatch[1])
                };
            } else if (deleteMatch) {
                // 添加上一个操作（如果有）
                if (currentOperation && currentOperation.type === 'INSERT' && currentCode.length > 0) {
                    operations.push({
                        type: 'INSERT',
                        lineNumber: currentOperation.lineNumber,
                        code: currentCode.join('\n')
                    });
                    currentCode = [];
                }
                
                // 添加删除操作
                operations.push({
                    type: 'DELETE',
                    startLine: parseInt(deleteMatch[1]),
                    endLine: parseInt(deleteMatch[2])
                });
                
                // 重置当前操作
                currentOperation = null;
            } else if (currentOperation && currentOperation.type === 'INSERT') {
                // 添加代码行到当前插入操作
                currentCode.push(line);
            }
        }
        
        // 添加最后一个插入操作（如果有）
        if (currentOperation && currentOperation.type === 'INSERT' && currentCode.length > 0) {
            operations.push({
                type: 'INSERT',
                lineNumber: currentOperation.lineNumber,
                code: currentCode.join('\n')
            });
        }
        
        // 如果没有解析出操作，尝试作为普通代码处理
        if (operations.length === 0) {
            // 清除可能存在的代码块标记
            let cleanCode = aiResponse
                .replace(/^```[\w\s]*\n/, '')
                .replace(/```$/, '')
                .trim();
                
            if (cleanCode) {
                // 如果没有指定操作，默认插入到选区的开始位置
                editor.executeEdits('ai-operation', [{
                    range: {
                        startLineNumber: selection.startLineNumber,
                        startColumn: 1,
                        endLineNumber: selection.startLineNumber,
                        endColumn: 1
                    },
                    text: cleanCode + '\n'
                }]);
            }
        } else {
            // 先进行删除操作，然后是插入操作，以避免行号变化影响操作
            const deleteOperations = operations.filter(op => op.type === 'DELETE').sort((a, b) => b.startLine - a.startLine);
            const insertOperations = operations.filter(op => op.type === 'INSERT').sort((a, b) => b.lineNumber - a.lineNumber);
            
            // 收集所有编辑
            const edits = [];
            
            // 处理删除操作
            for (const op of deleteOperations) {
                edits.push({
                    range: {
                        startLineNumber: op.startLine,
                        startColumn: 1,
                        endLineNumber: op.endLine + 1,
                        endColumn: 1
                    },
                    text: ''
                });
            }
            
            // 处理插入操作
            for (const op of insertOperations) {
                edits.push({
                    range: {
                        startLineNumber: op.lineNumber,
                        startColumn: 1,
                        endLineNumber: op.lineNumber,
                        endColumn: 1
                    },
                    text: op.code + '\n'
                });
            }
            
            // 应用所有编辑
            if (edits.length > 0) {
                editor.executeEdits('ai-operations', edits);
            }
        }
        
        // 生成操作摘要
        let summaryMessage = '已执行以下操作：\n';
        let hasDelete = false;
        let hasInsert = false;
        
        for (const op of operations) {
            if (op.type === 'DELETE') {
                hasDelete = true;
                if (op.startLine === op.endLine) {
                    summaryMessage += `- 删除了第${op.startLine}行\n`;
                } else {
                    summaryMessage += `- 删除了第${op.startLine}-${op.endLine}行\n`;
                }
            } else if (op.type === 'INSERT') {
                hasInsert = true;
                summaryMessage += `- 在第${op.lineNumber}行插入了代码\n`;
            }
        }
        
        if (!hasDelete && !hasInsert) {
            summaryMessage = '已处理AI响应';
        }
        
        // 显示成功提示
        showDialog({
            title: '操作完成',
            message: summaryMessage
        });
    } catch (error) {
        console.error('代码操作错误:', error);
        showDialog({
            title: '操作失败',
            message: '解析或应用AI代码操作时发生错误'
        });
    }
} 
