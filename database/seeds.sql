-- Insert sample users
INSERT INTO users (name, email, passwordHash, avatar_url, bio) VALUES
('Admin User', 'admin@example.com', '$2a$10$rVX5FNcY2NgCXYzVDTRMkODuQJX8H3Qv8KFXF.1/Xk7CQz.vGU2Uy', 'https://ui-avatars.com/api/?name=Admin+User', 'Platform administrator')
ON CONFLICT (email) DO NOTHING,
('Professora Ana Silva', 'ana.silva@example.com', '$2a$10$rVX5FNcY2NgCXYzVDTRMkODuQJX8H3Qv8KFXF.1/Xk7CQz.vGU2Uy', 'https://ui-avatars.com/api/?name=Ana+Silva', 'Professora especialista em redação para ENEM e vestibulares')
ON CONFLICT (email) DO NOTHING,
('Student User', 'student@example.com', '$2a$10$rVX5FNcY2NgCXYzVDTRMkODuQJX8H3Qv8KFXF.1/Xk7CQz.vGU2Uy', 'https://ui-avatars.com/api/?name=Student+User', 'Aspiring writer')
ON CONFLICT (email) DO NOTHING;

-- Insert sample courses
INSERT INTO courses (title, description, thumbnail_url, level, category, total_hours, instructor_id) VALUES
('Redação Nota 1000 no ENEM', 'Curso completo de preparação para a redação do ENEM. Aprenda as técnicas e estratégias para alcançar a nota máxima.', 'https://example.com/thumb1.jpg', 'Intermediário', 'ENEM', 40, 2)
ON CONFLICT (title) DO NOTHING,
('Escrita Criativa para Vestibulares', 'Aprenda técnicas avançadas de escrita criativa para se destacar nos vestibulares', 'https://example.com/thumb2.jpg', 'Avançado', 'Vestibular', 30, 2)
ON CONFLICT (title) DO NOTHING,
('Redação para Concursos', 'Técnicas avançadas para redações de concursos públicos', 'https://example.com/thumb3.jpg', 'Avançado', 'Concursos', 25, 2)
ON CONFLICT (title) DO NOTHING;

-- Insert sample modules for "Redação Nota 1000 no ENEM"
INSERT INTO modules (course_id, title, description, order_index) VALUES
(1, 'Fundamentos da Redação ENEM', 'Entenda a estrutura e os critérios de avaliação da redação do ENEM', 1)
ON CONFLICT (title) DO NOTHING,
(1, 'Desenvolvimento do Texto', 'Aprenda a desenvolver cada parágrafo com eficiência', 2)
ON CONFLICT (title) DO NOTHING,
(1, 'Conclusão e Proposta de Intervenção', 'Técnicas para uma conclusão impactante', 3)
ON CONFLICT (title) DO NOTHING;

-- Insert sample lessons with real educational YouTube videos
INSERT INTO lessons (module_id, title, description, video_url, duration, order_index) VALUES
(1, 'Estrutura da Redação ENEM', 'Entenda como estruturar sua redação para o ENEM', 'https://www.youtube.com/watch?v=yHxcJ8F8CLs', 45, 1)
ON CONFLICT (title) DO NOTHING,
(1, 'Critérios de Avaliação', 'Conheça todos os critérios de avaliação da redação', 'https://www.youtube.com/watch?v=yHxcJ8F8CLs', 30, 2)
ON CONFLICT (title) DO NOTHING,
(2, 'Desenvolvimento do Tema', 'Como desenvolver o tema com profundidade', 'https://www.youtube.com/watch?v=yHxcJ8F8CLs', 35, 1)
ON CONFLICT (title) DO NOTHING,
(2, 'Argumentação', 'Técnicas de argumentação eficiente', 'https://www.youtube.com/watch?v=yHxcJ8F8CLs', 40, 2)
ON CONFLICT (title) DO NOTHING,
(3, 'Proposta de Intervenção', 'Como criar uma proposta de intervenção completa', 'https://www.youtube.com/watch?v=yHxcJ8F8CLs', 35, 1)
ON CONFLICT (title) DO NOTHING,
(3, 'Revisão Final', 'Checklist para revisão da redação', 'https://www.youtube.com/watch?v=yHxcJ8F8CLs', 25, 2)
ON CONFLICT (title) DO NOTHING;

-- Insert sample materials
INSERT INTO materials (lesson_id, title, type, url) VALUES
(1, 'Guia de Estrutura da Redação', 'pdf', 'https://example.com/guide1.pdf')
ON CONFLICT (title) DO NOTHING,
(1, 'Exemplos de Redações Nota 1000', 'pdf', 'https://example.com/examples1.pdf')
ON CONFLICT (title) DO NOTHING,
(2, 'Planilha de Critérios', 'xlsx', 'https://example.com/criteria.xlsx')
ON CONFLICT (title) DO NOTHING,
(3, 'Template de Redação', 'docx', 'https://example.com/template.docx')
ON CONFLICT (title) DO NOTHING,
(4, 'Lista de Conectivos', 'pdf', 'https://example.com/conectivos.pdf')
ON CONFLICT (title) DO NOTHING,
(5, 'Exemplos de Propostas de Intervenção', 'pdf', 'https://example.com/intervencoes.pdf')
ON CONFLICT (title) DO NOTHING,
(6, 'Checklist de Revisão', 'pdf', 'https://example.com/checklist.pdf')
ON CONFLICT (title) DO NOTHING;

-- Insert sample achievements
INSERT INTO achievements (title, description, icon) VALUES
('Primeira Redação', 'Enviou sua primeira redação', 'pencil')
ON CONFLICT (title) DO NOTHING,
('Escritor Dedicado', 'Completou 10 redações', 'book')
ON CONFLICT (title) DO NOTHING,
('Nota Máxima', 'Alcançou nota 1000 em uma redação', 'star')
ON CONFLICT (title) DO NOTHING,
('Mestre da Argumentação', 'Completou o módulo de argumentação', 'award')
ON CONFLICT (title) DO NOTHING,
('Expert em Conclusões', 'Completou o módulo de conclusões', 'check-circle')
ON CONFLICT (title) DO NOTHING;

-- Insert sample writing submissions
INSERT INTO writing_submissions (user_id, title, content, status, reviewer_id, score, feedback) VALUES
(3, 'O Impacto da Tecnologia na Educação', 'Conteúdo da redação sobre tecnologia...', 'completed', 2, 850, 'Ótimo desenvolvimento do tema. Sugestões de melhoria: aprofundar mais a proposta de intervenção.')
ON CONFLICT (title) DO NOTHING,
(3, 'Desafios da Mobilidade Urbana', 'Conteúdo da redação sobre mobilidade...', 'pending', NULL, NULL, NULL)
ON CONFLICT (title) DO NOTHING;

-- Insert sample user progress
INSERT INTO user_progress (user_id, lesson_id, completed, completed_at) VALUES
(3, 1, true, CURRENT_TIMESTAMP)
ON CONFLICT (user_id, lesson_id) DO NOTHING,
(3, 2, true, CURRENT_TIMESTAMP)
ON CONFLICT (user_id, lesson_id) DO NOTHING,
(3, 3, true, CURRENT_TIMESTAMP)
ON CONFLICT (user_id, lesson_id) DO NOTHING,
(3, 4, false, NULL)
ON CONFLICT (user_id, lesson_id) DO NOTHING;

-- Insert sample user achievements
INSERT INTO user_achievements (user_id, achievement_id) VALUES
(3, 1)
ON CONFLICT (user_id, achievement_id) DO NOTHING,
(3, 4)
ON CONFLICT (user_id, achievement_id) DO NOTHING;

-- Insert sample study notes
INSERT INTO study_notes (user_id, lesson_id, content) VALUES
(3, 1, 'Importante: sempre relacionar com atualidades e usar dados estatísticos')
ON CONFLICT (user_id, lesson_id) DO NOTHING,
(3, 2, 'Revisar os critérios antes de cada redação. Foco especial em coesão e coerência.')
ON CONFLICT (user_id, lesson_id) DO NOTHING;
