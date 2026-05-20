-- Tag 24/7 emergency shelter hours for the emergency help feature
UPDATE organizations
SET hours = '24/7 — ' || hours
WHERE slug = 'harbor-light-shelter';
