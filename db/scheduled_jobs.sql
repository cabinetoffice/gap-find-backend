INSERT INTO public.scheduled_job(type, timer)
VALUES 
('GRANT_UPDATED', '* * * * *'),
('GRANT_UPCOMING', '* * * * *');
('NEW_GRANTS', '* * * * *');
('SAVED_SEARCH_MATCHES', '* * * * *');
('SAVED_SEARCH_MATCHES_NOTIFICATION', '* * * * *')