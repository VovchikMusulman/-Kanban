// Определение компонента задачи
Vue.component('task', {
    props: ['task', 'columnIndex', 'taskIndex', 'getNextColumnTitle'],
    template: `
        <div class="task">
            <h3>{{ task.title }}</h3>
            <p><strong>Описание:</strong> {{ task.description }}</p>
            <p><strong>Создано:</strong> {{ task.createdAt }}</p>
            <p><strong>Обновлено:</strong> {{ task.updatedAt }}</p>
            <p><strong>Дэдлайн:</strong> {{ task.deadline }}</p>
            <p v-if="task.returnReason"><strong>Причина возврата:</strong> {{ task.returnReason }}</p>
            <p v-if="task.status"><strong>Статус:</strong> {{ task.status }}</p>
            <button v-if="columnIndex < 3" @click="$emit('move-task', columnIndex, columnIndex + 1, taskIndex)">
                {{ getNextColumnTitle(columnIndex) }}
            </button>
            <button v-if="columnIndex === 2" @click="$emit('return-task', columnIndex, taskIndex)">Вернуть в работу</button>
            <div>
                <button v-if="columnIndex === 0 || columnIndex === 1 || columnIndex === 2" @click="$emit('edit-task', columnIndex, taskIndex)">Редактировать</button>
                <button v-if="columnIndex === 0" @click="$emit('delete-task', columnIndex, taskIndex)">Удалить</button>
            </div>
        </div>
    `
});

// Определение компонента колонки
Vue.component('column', {
    props: ['column', 'columnIndex', 'addTask', 'getNextColumnTitle'],
    template: `
        <div class="column">
            <h2>{{ column.title }}</h2>
            <task 
                v-for="(task, taskIndex) in column.tasks" 
                :key="taskIndex" 
                :task="task" 
                :columnIndex="columnIndex" 
                :taskIndex="taskIndex" 
                :getNextColumnTitle="getNextColumnTitle"
                @move-task="$emit('move-task', ...arguments)"
                @edit-task="$emit('edit-task', ...arguments)"
                @delete-task="$emit('delete-task', ...arguments)"
                @return-task="$emit('return-task', ...arguments)"
            ></task>
            <button v-if="columnIndex === 0" @click="addTask">Добавить задачу</button>
        </div>
    `
});

// Определение компонента модального окна для задач и возвратов
Vue.component('task-return-modal', {
    props: {
        showModal: Boolean,
        newTask: Object,
        editingTaskIndex: Number,
        returnReason: String,
        isReturn: Boolean,
        saveTask: Function,
        confirmReturn: Function,
        closeModal: Function
    },
    template: `
        <div v-if="showModal" class="modal">
            <div class="modal-content">
                <span class="close" @click="closeModal">&times;</span>
                <h2>{{ isReturn ? 'Укажите причину возврата' : (editingTaskIndex !== null ? 'Редактировать задачу' : 'Добавить задачу') }}</h2>
                <div v-if="!isReturn">
                    <input v-model="newTask.title" placeholder="Заголовок задачи" maxlength="30"/>
                    <textarea v-model="newTask.description" placeholder="Описание задачи" maxlength="300"></textarea>
                    <p>Дедлайн:</p>
                    <input type="date" v-model="newTask.deadline" />
                    <button @click="saveTask">
                        {{ editingTaskIndex !== null ? 'Сохранить изменения' : 'Добавить задачу' }}
                    </button>
                </div>
                <div v-else>
                    <textarea v-model="returnReason" placeholder="Причина возврата"></textarea>
                    <button @click="confirmReturn">Подтвердить возврат</button>
                </div>
            </div>
        </div>
    `
});

// Основное приложение
const app = new Vue({
    el: '#app',
    data: {
        columns: [
            { title: 'Запланированные задачи', tasks: [] },
            { title: 'Задачи в работе', tasks: [] },
            { title: 'Тестирование', tasks: [] },
            { title: 'Выполненные задачи', tasks: [] }
        ],
        newTask: {
            title: '',
            description: '',
            deadline: ''
        },
        showModal: false,
        editingTaskIndex: null,
        editingColumnIndex: null,
        returnReason: '',
        showReturnModal: false
    },
    methods: {
        addTask() {
            if (this.newTask.title) {
                const task = {
                    ...this.newTask,
                    createdAt: new Date().toLocaleString(),
                    updatedAt: new Date().toLocaleString(),
                    status: ''
                };
                this.columns[0].tasks.push(task);
                this.resetNewTask();
                this.showModal = false;
            }
            this.editingTaskIndex = null;
            this.editingColumnIndex = null;
        },
        deleteTask(columnIndex, taskIndex) {
            this.columns[columnIndex].tasks.splice(taskIndex, 1);
        },
        editTask(columnIndex, taskIndex) {
            const task = this.columns[columnIndex].tasks[taskIndex];
            this.newTask = { ...task };
            this.editingTaskIndex = taskIndex;
            this.editingColumnIndex = columnIndex;
            this.showModal = true;
        },
        saveEditedTask() {
            if (this.newTask.title) {
                const task = this.columns[this.editingColumnIndex].tasks[this.editingTaskIndex];
                Object.assign(task, this.newTask, { updatedAt: new Date().toLocaleString() });
                this.resetNewTask();
                this.showModal = false;
                this.editingTaskIndex = null;
                this.editingColumnIndex = null;
            }
        },
        moveTask(fromColumnIndex, toColumnIndex, taskIndex) {
            const task = this.columns[fromColumnIndex].tasks.splice(taskIndex, 1)[0];
            if (toColumnIndex === 3) {
                const deadlineDate = new Date(task.deadline);
                const currentDate = new Date();
                task.status = deadlineDate < currentDate ? 'Просроченная' : 'Выполненная в срок';
            }
            this.columns[toColumnIndex].tasks.push(task);
        },
        returnTask(columnIndex, taskIndex) {
            this.editingTaskIndex = taskIndex;
            this.editingColumnIndex = columnIndex;
            this.showReturnModal = true;
        },
        confirmReturn() {
            const task = this.columns[this.editingColumnIndex].tasks[this.editingTaskIndex];
            task.returnReason = this.returnReason; // Присваиваем причину возврата
            this.moveTask(this.editingColumnIndex, 1, this.editingTaskIndex); // Перемещаем задачу в колонку "Задачи в работе"
            this.returnReason = ''; // Сбрасываем причину возврата
            this.showReturnModal = false; // Закрываем модальное окно
        },
        getNextColumnTitle(columnIndex) {
            switch (columnIndex) {
                case 0: return 'В Работу';
                case 1: return 'В Тестирование';
                case 2: return 'Выполнено';
                default: return '';
            }
        },
        resetNewTask() {
            this.newTask = { title: '', description: '', deadline: '' };
        },
        openAddTaskModal() {
            this.resetNewTask();
            this.editingTaskIndex = null;
            this.editingColumnIndex = null;
            this.showModal = true;
        }
    },
    template: `
        <div class="kanban-board">
            <column 
                v-for="(column, columnIndex) in columns" 
                :key="columnIndex" 
                :column="column" 
                :columnIndex="columnIndex" 
                :addTask="openAddTaskModal" 
                :getNextColumnTitle="getNextColumnTitle"
                @move-task="moveTask"
                @edit-task="editTask"
                @delete-task="deleteTask"
                @return-task="returnTask"
            ></column>

            <task-return-modal 
                v-if="showModal || showReturnModal" 
                :showModal="showModal || showReturnModal" 
                :newTask="newTask" 
                :editingTaskIndex="editingTaskIndex" 
                :returnReason="returnReason" 
                :isReturn="showReturnModal"
                :saveTask="editingTaskIndex !== null ? saveEditedTask : addTask" 
                :confirmReturn="confirmReturn" 
                :closeModal="() => { showModal = false; showReturnModal = false; }"
            ></task-return-modal>
        </div>
    `
});