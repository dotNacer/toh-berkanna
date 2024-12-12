import { TypingPhrase } from './typingPhraseInterface'

export const TYPING_PHRASES: TypingPhrase[] = [
    { id: 1, text: 'git push origin main --force', category: 'git' },
    { id: 2, text: 'git reset --hard HEAD~1', category: 'git' },
    { id: 3, text: 'docker-compose up -d --build', category: 'docker' },
    { id: 4, text: 'npm install --save-dev @angular/cli', category: 'npm' },
    { id: 5, text: 'sudo chmod +x deploy.sh', category: 'linux' },
    { id: 6, text: 'git checkout -b feature/new-branch', category: 'git' },
    { id: 7, text: 'docker exec -it container_name bash', category: 'docker' },
    { id: 8, text: 'npm run build --production', category: 'npm' },
    { id: 9, text: 'git rebase -i HEAD~3', category: 'git' },
    { id: 10, text: 'ssh-keygen -t rsa -b 4096', category: 'linux' },
]
