DROP TABLE IF EXISTS public.bar_menu;

CREATE TABLE public.bar_menu(
  bar_id int REFERENCES bar,
  menu_id int REFERENCES menu,
  menu_name text,
  PRIMARY KEY (bar_id, menu_id)
);

